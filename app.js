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

const conexao = mysql.createConnection({
    host:'testes_database_for_utm',
    user:'root',
    password:'MYSQLroot8110@yow',
    database:'vendedor_produto',
    port: 3306

});

// Configuração de conexão no local host:
// const conexao = mysql.createConnection({
//     host:'127.0.0.1',
//     user:'root',
//     password:'MYSQLroot8110@yow',
//     database:'vendedor_produto'
// });

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
   try{
     // Obter os dados que serão utiliados para o cadastro
     let nome = req.body.nome;
     let valor = req.body.valor;
     let categoria = req.body.categoria;
     let imagem = req.files.imagem.name;

     // Validar o nome do produto e o valor
     if(nome == '' || valor == '' || isNaN(valor) || categoria == ''){
        res.redirect('/falhaCadastro');
     }else{
        
        // SQL
        let sql = `INSERT INTO produtos (nome, valor, imagem, categoria) VALUES ('${nome}', ${valor}, '${imagem}', '${categoria}')`;

        if (!categoria || categoria.trim() === '') {
            categoria = 'Sem Categoria'; // Valor padrão
        }
        
        // Executar comando SQL
        conexao.query(sql, function(erro, retorno){
            // Caso ocorra algum erro
            if(erro) throw erro;

            // Caso ocorra o cadastro
            req.files.imagem.mv(__dirname+'/imagens/'+req.files.imagem.name);
            console.log(retorno);
        });

        // Retornar para a rota principal
        res.redirect('/okCadastro');
     }
   }catch(erro){
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
app.post('/editar', function(req, res){

    // Obter os dados do formulário
    let nome = req.body.nome;
    let valor = req.body.valor;
    let id_produto  = req.body.id_produto;
    let nomeImagem = req.body.nomeImagem;

    // Validar nome do produto e valor
    if(nome == '' || valor == '' || isNaN(valor)){
        res.redirect('/falhaEdicao');
    }else {

        // Definir o tipo de edição
        try{
            // Objeto de imagem
            let imagem = req.files.imagem;

            // SQL
            let sql = `UPDATE Produto SET nome='${nome}', valor=${valor}, imagem='${imagem}', categoria='${categoria}' WHERE id_produto=${id_produto}`;

    
            // Executar comando SQL
            conexao.query(sql, function(erro, retorno){
                // Caso falhe o comando SQL
                if(erro) throw erro;

                // Remover imagem antiga
                fs.unlink(__dirname+'/imagens/'+nomeImagem, (erro_imagem)=>{
                    console.log('Falha ao remover a imagem.');
                });

                // Cadastrar nova imagem
                imagem.mv(__dirname+'/imagens/'+imagem.name);
            });
        }catch(erro){
            
            // SQL
            let sql = `UPDATE Produto SET nome='${nome}', valor=${valor} WHERE id_produto=${id_produto}`;
        
            // Executar comando SQL
            conexao.query(sql, function(erro, retorno){
                // Caso falhe o comando SQL
                if(erro) throw erro;
            });
        }

        // Redirecionamento
        res.redirect('/okEdicao');
    }
});

// Servidor
app.listen(8080);