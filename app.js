const express = require('express');
const { format, parseISO } = require('date-fns');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

// Carregar variáveis de ambiente
const ASAAS_API_URL = process.env.ASAAS_API_URL;
const ASAAS_API_TOKEN = process.env.ASAAS_API_TOKEN;
const API_SECRET_TOKEN = process.env.API_SECRET_TOKEN;
const PORT = process.env.PORT || 3002;

if (!ASAAS_API_URL || !ASAAS_API_TOKEN || !API_SECRET_TOKEN) {
    console.error("Erro: Variáveis de ambiente obrigatórias não definidas.");
    process.exit(1);
}

// Middleware para validar o token de autorização
const validateToken = (req, res, next) => {
    const clientToken = req.headers['authorization'];

    if (!clientToken || !clientToken.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token de autorização é obrigatório.' });
    }

    const token = clientToken.split(' ')[1]; // Remove "Bearer"
    if (token !== API_SECRET_TOKEN) {
        return res.status(403).json({ error: 'Token de autorização inválido.' });
    }

    next();
};

const formatDate = (dateString) => {
    const date = parseISO(dateString); // Interpreta a data sem alterações de fuso horário
    return format(date, 'dd/MM/yyyy'); // Formata no padrão brasileiro
};

// Configurar cliente Axios para a API do Asaas
const asaasRequest = axios.create({
    baseURL: ASAAS_API_URL,
    headers: {
        'access_token': ASAAS_API_TOKEN,
        'Content-Type': 'application/json',
    },
});

// Rota principal para consulta de boletos
app.post('/api/consulta-boletos', validateToken, async (req, res) => {
    const { cpfCnpj } = req.body;

    // Validação do CPF/CNPJ
    if (!cpfCnpj) {
        return res.status(400).json({ error: 'erroAsaas' });
    }

    try {
        // 1. Buscar cliente no Asaas
        console.log(`Buscando cliente no Asaas para CPF/CNPJ: ${cpfCnpj}`);
        const customerResponse = await asaasRequest.get(`/customers?cpfCnpj=${cpfCnpj}`);
        console.log("Resposta da API para cliente:", customerResponse.data);

        const customer = customerResponse.data.data[0];

        if (!customer) {
            return res.status(404).json({ message: 'NaoEncontrado' });
        }

        const customerId = customer.id;

        // 2. Buscar cobranças pendentes ou vencidas
        console.log(`Buscando cobranças pendentes ou vencidas para o cliente: ${customerId}`);
        const paymentsResponse = await asaasRequest.get(`/payments?customer=${customerId}&status=PENDING,OVERDUE`);
        console.log("Resposta da API para cobranças:", paymentsResponse.data);

        const payments = paymentsResponse.data.data;

        if (!payments || payments.length === 0) {
            return res.status(200).json({ message: 'NaoEncontrado' });
        }

        // 3. Separar boletos vencidos e pendentes
        const overduePayments = payments.filter(payment => payment.status === 'OVERDUE');
        const pendingPayments = payments.filter(payment => payment.status === 'PENDING');

        // 4. Selecionar resposta
        if (overduePayments.length > 0) {
            // Listar todos os boletos vencidos
            const overdueResults = overduePayments.map(payment => ({
                vencimento: formatDate(payment.dueDate),
                valor: payment.value,
                linkPagamento: payment.invoiceUrl || payment.bankSlipUrl,
            }));

            return res.status(200).json({
                cliente: customer.name,
                boletosVencidos: overdueResults,
            });
        }

        // Caso contrário, pegar o próximo vencimento entre os boletos pendentes
        const nextPayment = pendingPayments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];

        const result = {
            cliente: customer.name,
            vencimento: formatDate(nextPayment.dueDate),
            valor: nextPayment.value,
            linkPagamento: nextPayment.invoiceUrl || nextPayment.bankSlipUrl,
        };

        res.status(200).json(result);
    } catch (error) {
        console.error("Erro durante o processamento:", error.response?.data || error.message);
        res.status(500).json({ error: 'erroAsaas' });
    }
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
