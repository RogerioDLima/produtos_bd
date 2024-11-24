// Importações
const express = require('express');
const fileupload = require('express-fileupload');
const { engine } = require('express-handlebars');
const mysql = require('mysql2');
const fs = require('fs');

// App
const app = express();

// Habilitar upload de arquivos e configuração de views
app.use(fileupload());
app.use('/bootstrap', express.static('./node_modules/bootstrap/dist'));
app.use('/css', express.static('./css'));
app.use('/imagens', express.static('./imagens'));

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configurar conexão com banco de dados
const conexao = mysql.createConnection({
    host: 'ywsa8i.easypanel.host',
    user: 'mysql',
    password: 'MYSQLroot8110@yow',
    database: 'vendedor_produto'
});

conexao.connect(function (erro) {
    if (erro) throw erro;
    console.log('Conexão efetuada com sucesso!');
});

// **ROTA PRINCIPAL**: Listar produtos e vendedores
app.get('/', (req, res) => {
    const sql = `SELECT Produto.id_produto, Produto.nome AS nome_produto, 
                        Produto.quantidade, Produto.preco, Produto.descricao, 
                        Vendedor.nome AS nome_vendedor 
                 FROM Produto 
                 JOIN Vendedor ON Produto.id_vendedor = Vendedor.id_vendedor`;
    conexao.query(sql, (erro, resultado) => {
        if (erro) throw erro;
        res.render('index', { produtos: resultado });
    });
});

// **ROTA DE CADASTRO DE PRODUTOS**
app.post('/cadastrarProduto', (req, res) => {
    try {
        const { nome, quantidade, preco, descricao, id_vendedor } = req.body;
        const imagem = req.files?.imagem?.name;

        if (!nome || !quantidade || isNaN(preco) || !descricao || !id_vendedor) {
            return res.redirect('/falhaCadastro');
        }

        const sql = `INSERT INTO Produto (nome, quantidade, preco, descricao, imagem, id_vendedor) 
                     VALUES (?, ?, ?, ?, ?, ?)`;
        conexao.query(
            sql,
            [nome, quantidade, preco, descricao, imagem, id_vendedor],
            (erro) => {
                if (erro) throw erro;
                if (imagem) {
                    req.files.imagem.mv(__dirname + '/imagens/' + imagem);
                }
                res.redirect('/okCadastro');
            }
        );
    } catch (erro) {
        console.error(erro);
        res.redirect('/falhaCadastro');
    }
});

// **ROTA DE REMOÇÃO DE PRODUTOS**
app.get('/removerProduto/:id_produto', (req, res) => {
    const { id_produto } = req.params;
    const sql = `DELETE FROM Produto WHERE id_produto = ?`;

    conexao.query(sql, [id_produto], (erro) => {
        if (erro) throw erro;
        res.redirect('/okRemover');
    });
});

// **ROTA DE EDIÇÃO DE PRODUTOS**
app.post('/editarProduto', (req, res) => {
    const { id_produto, nome, quantidade, preco, descricao } = req.body;

    const sql = `UPDATE Produto 
                 SET nome = ?, quantidade = ?, preco = ?, descricao = ? 
                 WHERE id_produto = ?`;

    conexao.query(
        sql,
        [nome, quantidade, preco, descricao, id_produto],
        (erro) => {
            if (erro) throw erro;
            res.redirect('/okEdicao');
        }
    );
});

// **CRUD PARA VENDEDORES**
// Cadastro de vendedor
app.post('/cadastrarVendedor', (req, res) => {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.redirect('/falhaCadastro');
    }

    const sql = `INSERT INTO Vendedor (nome, email, senha) VALUES (?, ?, ?)`;
    conexao.query(sql, [nome, email, senha], (erro) => {
        if (erro) throw erro;
        res.redirect('/okCadastro');
    });
});

// Listar todos os vendedores
app.get('/vendedores', (req, res) => {
    const sql = `SELECT * FROM Vendedor`;
    conexao.query(sql, (erro, resultado) => {
        if (erro) throw erro;
        res.render('vendedores', { vendedores: resultado });
    });
});

// Remover vendedor
app.get('/removerVendedor/:id_vendedor', (req, res) => {
    const sql = `DELETE FROM Vendedor WHERE id_vendedor = ?`;
    conexao.query(sql, [req.params.id_vendedor], (erro) => {
        if (erro) throw erro;
        res.redirect('/okRemover');
    });
});

// Servidor
app.listen(8080, () => {
    console.log('Servidor rodando na porta 8080!');
});
