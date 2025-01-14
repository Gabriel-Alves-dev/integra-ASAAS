# Informação financeiras do ASAAS

O projeto se trata de uma pequena aplicação para uma necessidade que surgiu na empresa que trabalho. Basicamente é um tratamente de dados usados de algumas requests em conjunto da API do sistema financeiro ASAAS.

---

## Requisição:

Com o metodo POST é capaz de de fazer requisições com o seguinte 
Header:
```
  {
  "Content-Type": "application/json"
  "Authorization": "Bearer (seu token)"
  }
```
Body(raw):
```
  {
  "cpfCnpj": "cpf que quer buscar"
  }
```

## Exemplo de Resposta:
```
  {
      "cliente": "Gabriel Alves",
      "vencimento": "dd/mm/yyyy",
      "valor": 150,
      "linkPagamento": "https://www.asaas.com/linkdopagamento"
  }
```

## Observações:

Adicionei mais um token para não ser requisitado usando abertamente o token do ASAAS, você mesmo consegue escolher o seu adicionando-o ao arquivo .env!

---

# 🤝 Colaboração:

Fique a vontade para colaborar e para me encontrar em outras redes!

Segue meu linkedIn:
https://www.linkedin.com/in/gabriel-alves-787208250/
