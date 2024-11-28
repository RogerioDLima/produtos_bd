const express = require('express');
const fileupload = require('express-fileupload');
const { engine } = require('express-handlebars');
const mysql = require('mysql2');
const fs = require('fs');
const app = express();
app.use(fileupload());
app.use('/bootstrap', express.static('./node_modules/bootstrap/dist'));
app.use('/css', express.static('./css'));
app.use('/imagens', express.static('./imagens'));



app.engine('handlebars', engine({
    helpers: {
      // Função auxiliar para verificar igualdade
      condicionalIgualdade: function (parametro1, parametro2, options) {
        return parametro1 === parametro2 ? options.fn(this) : options.inverse(this);
      }
    }
  }));
app.set('view engine', 'handlebars');
app.set('views', './views');

// Manipulação de dados via rotas
app.use(express.json());
app.use(express.urlencoded({extended:false}));

// Configuração de conexão online
// const conexao = mysql.createConnection({
//     host:'ywsa8i.easypanel.host',
//     user:'root',
//     password:'MYSQLroot8110@yow',
//     database:'vendedor_produto',
//     port: 7777

// });

// const conexao = mysql.createConnection({
//     host:'testes_database_for_utm',
//     user:'root',
//     password:'MYSQLroot8110@yow',
//     database:'vendedor_produto',
//     port: 3306

// });


const conexao = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'MYSQLroot8110@yow',
    database:'vendedor_produto',
    port:3306
});

conexao.connect(function(erro){
    if(erro) throw erro;
    console.log('Conexão efetuada com sucesso!');
});

// Rota principal
app.get('/', function(req, res){
    // SQL
    let sql = 'SELECT * FROM Produto';

    // Executar comando SQL
    conexao.query(sql, function(erro, retorno){
        res.render('formulario', {produtos:retorno});
    });
});

// Rota principal contendo a situação
app.get('/:situacao', function(req, res){
    // SQL
    let sql = 'SELECT * FROM Produto';

    // Executar comando SQL
    conexao.query(sql, function(erro, retorno){
        res.render('formulario', {produtos:retorno, situacao:req.params.situacao});
    });
});

// Rota de cadastro
app.post('/cadastrar', function(req, res){
    try {
        // Obter os dados do formulário
        let { nome, id_vendedor, quantidade, preco, descricao, categoria } = req.body;
        let imagem = req.files?.imagem?.name;

        // Validar os dados
        if (!nome || !preco || isNaN(preco) || !imagem || !categoria) {
            return res.redirect('/falhaCadastro');
        }

        // Valor padrão para categoria, se necessário
        if (!categoria.trim()) {
            categoria = 'Sem Categoria';
        }

        // SQL para inserção
        let sql = `INSERT INTO produto (nome, id_vendedor, quantidade, preco, descricao, imagem, categoria) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;

        // Executar o comando SQL
        conexao.query(sql, [nome, id_vendedor, quantidade, preco, descricao, imagem, categoria], function(erro) {
            if (erro) throw erro;

            // Mover a imagem para o diretório correto
            req.files.imagem.mv(__dirname + '/imagens/' + imagem);

            res.redirect('/okCadastro');
        });
    } catch (erro) {
        res.redirect('/falhaCadastro');
    }
});

// Rota para remover produtos
app.get('/remover/:id_produto/:imagem', function(req, res){
    
    // Tratamento de exeção
    try{
        // SQL
        let sql = `DELETE FROM Produto WHERE id_produto = ${req.params.id_produto}`;

        // Executar o comando SQL
        conexao.query(sql, function(erro, retorno){
            // Caso falhe o comando SQL
            if(erro) throw erro;

            // Caso o comando SQL funcione
            fs.unlink(__dirname+'/imagens/'+req.params.imagem, (erro_imagem)=>{
                console.log('Falha ao remover a imagem');
            });
        });

        // Redirecionamento
        res.redirect('/okRemover');
    }catch(erro){
        res.redirect('/falhaRemover');
    }

});

// Rota para redirecionar para o formulário de alteração/edição
app.get('/formularioEditar/:id_produto', function(req, res){
    
    // SQL
    let sql = `SELECT * FROM Produto WHERE id_produto = ${req.params.id_produto}`;

    // Executar o comando SQL
    conexao.query(sql, function(erro, retorno){
        // Caso haja falha no comando SQL
        if(erro) throw erro;

        // Caso consiga executar o comando SQL
        res.render('formularioEditar', {produto:retorno[0]});
    });

});

// Rota para editar produtos
app.post('/editar', function(req, res) {
    try {
        // Obter os dados do formulário
        let id_produto = req.body.id_produto; // Certifique-se de que o ID do produto seja enviado
        let nome = req.body.nome;
        let descricao = req.body.descricao;
        let preco = req.body.preco;
        let novaImagem = req.files ? req.files.imagem : null;

        // Validar campos obrigatórios
        if (!id_produto || !nome || !descricao || !preco || isNaN(preco)) {
            return res.redirect('/falhaEdicao');
        }

        // Buscar o produto no banco para verificar a imagem existente
        let sqlSelect = `SELECT imagem FROM Produto WHERE id_produto = ${id_produto}`;
        conexao.query(sqlSelect, function(erro, resultados) {
            if (erro) throw erro;

            let imagemAntiga = resultados[0]?.imagem;

            // Atualizar a imagem se uma nova foi enviada
            if (novaImagem) {
                let novaImagemNome = novaImagem.name;

                // Salvar nova imagem no diretório
                novaImagem.mv(__dirname + '/imagens/' + novaImagemNome, function(erro) {
                    if (erro) throw erro;

                    // Remover a imagem antiga, se existir
                    if (imagemAntiga) {
                        fs.unlink(__dirname + '/imagens/' + imagemAntiga, (erro) => {
                            if (erro) console.log('Erro ao remover a imagem antiga:', erro);
                        });
                    }

                    // SQL para atualizar com a nova imagem
                    let sqlUpdate = `UPDATE Produto 
                                     SET nome = ?, descricao = ?, preco = ?, imagem = ? 
                                     WHERE id_produto = ?`;

                    conexao.query(sqlUpdate, [nome, descricao, preco, novaImagemNome, id_produto], function(erro, retorno) {
                        if (erro) throw erro;
                        res.redirect('/okEdicao');
                    });
                });
            } else {
                // SQL para atualizar sem alterar a imagem
                let sqlUpdateSemImagem = `UPDATE Produto 
                                          SET nome = ?, descricao = ?, preco = ? 
                                          WHERE id_produto = ?`;

                conexao.query(sqlUpdateSemImagem, [nome, descricao, preco, id_produto], function(erro, retorno) {
                    if (erro) throw erro;
                    res.redirect('/okEdicao');
                });
            }
        });
    } catch (erro) {
        console.error('Erro ao editar o produto:', erro);
        res.redirect('/falhaEdicao');
    }
});


// Servidor
app.listen(8080);