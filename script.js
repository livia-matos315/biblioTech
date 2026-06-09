let livroSelecionadoTemporario = null;

function alternarTelas(tela) {
    const caixaLogin = document.getElementById('caixa-login');
    const caixaCadastro = document.getElementById('caixa-cadastro');
    
    if (tela === 'cadastro') {
        caixaLogin.style.display = 'none';
        caixaCadastro.style.display = 'block';
    } else {
        caixaLogin.style.display = 'block';
        caixaCadastro.style.display = 'none';
    }
}

function executarCadastro() {
    const nome = document.getElementById('name').value.trim();
    const cpf = document.getElementById('cpf').value.trim();
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value.trim();

    if (nome.length >= 3 && cpf.length === 11 && email !== '' && senha.length >= 4) {
        const novoUsuario = {
            nome: nome,
            cpf: cpf,
            email: email,
            senha: senha,
            perfil: 'cliente'
        };

        let listaUsuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
        const emailExiste = listaUsuarios.some(user => user.email === email);

        if (!emailExiste) {
            listaUsuarios.push(novoUsuario);
            localStorage.setItem("usuarios", JSON.stringify(listaUsuarios));
            
            console.log("=== USUÁRIO CADASTRADO NO LOCALSTORAGE ===");
            console.log("Objeto salvo:", novoUsuario);
            console.log("Lista completa atualizada:", listaUsuarios);
            
            alert("Cadastro realizado com sucesso! Retornando para a tela de login.");
            document.getElementById('cadastro-form-exec').reset();
            alternarTelas('login');
        } else {
            alert("Este e-mail já está cadastrado!");
        }
    } else {
        alert("Por favor, preencha os campos corretamente!");
    }
}

function executarLogin(e) {
    if (e) e.preventDefault(); 
    if (window.event) window.event.preventDefault();

    const emailInput = document.getElementById('login-email').value.trim();
    const senhaInput = document.getElementById('login-senha').value.trim();

    if (emailInput === '' || senhaInput === '') {
        alert("Por favor, preencha todos os campos!");
        return;
    }

    if (emailInput === 'admin' && senhaInput === 'admin') {
        const usuarioAdmin = {
            nome: "Administrador",
            email: "admin",
            perfil: "admin"
        };
        sessionStorage.setItem("usuarioLogado", JSON.stringify(usuarioAdmin));
        alert("Login efetuado como Administrador!");
        window.location.href = "tela-admin.html"; 
        return;
    }

    let listaUsuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    const usuarioEncontrado = listaUsuarios.find(user => user.email === emailInput && user.senha === senhaInput);

    if (usuarioEncontrado) {
        sessionStorage.setItem("usuarioLogado", JSON.stringify(usuarioEncontrado));
        alert(`Bem-vindo, ${usuarioEncontrado.nome}!`);
        
        if (usuarioEncontrado.perfil === 'admin') {
            window.location.href = "tela-admin.html";
        } else {
            window.location.href = "biblioteca.html"; 
        }
    } else {
        alert("Usuário ou senha incorretos! Se não tiver conta, cadastre-se.");
        alternarTelas('cadastro');
    }
}

window.onload = function () {
    const usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado'));
    const path = window.location.pathname;
    const paginaAtual = path.substring(path.lastIndexOf('/') + 1);

    console.log("=== AUDITORIA DE ROTAS ===");
    console.log("Caminho:", paginaAtual);
    console.log("Sessão encontrada:", usuarioLogado);

    if (paginaAtual === 'index.html') {
        if (usuarioLogado) {
            if (usuarioLogado.perfil === 'admin') {
                window.location.href = 'tela-admin.html';
            } else {
                window.location.href = 'biblioteca.html';
            }
        }
        return;
    }

    if (paginaAtual === 'tela-admin.html') {
        if (!usuarioLogado || usuarioLogado.perfil !== 'admin') {
            window.location.href = 'index.html';
            return;
        }

        document.getElementById('boas-vindas').innerText =
            "Painel de Controle - Logado como: " + usuarioLogado.nome;

        carregarClientes();
        carregarEmprestimosAdmin();
        return;
    }
    if (paginaAtual === 'biblioteca.html') {
        if (!usuarioLogado) {
            window.location.href = 'index.html';
            return;
        }

        document.getElementById('boas-vindas').innerText =
            "Biblioteca - Bem-vindo(a), " + usuarioLogado.nome;
    }
};

function carregarClientes() {
    const container = document.getElementById('lista-clientes');
    if (!container) return;

    const listaUsuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
    const listaClientes = listaUsuarios.filter(user => user.perfil === 'cliente');

    if (listaClientes.length === 0) {
        container.innerHTML = '<p class="sem-clientes" style="color: #999; font-style: italic;">Nenhum cliente cadastrado ainda.</p>';
        return;
    }
    
    container.innerHTML = '';
    listaClientes.forEach(cliente => {
        const card = document.createElement('div');
        card.className = 'card-cliente';
        card.style.background = '#f8f9fa';
        card.style.border = '1px solid #e9ecef';
        card.style.borderRadius = '8px';
        card.style.padding = '12px';
        
        card.innerHTML = "<h3>" + cliente.nome + "</h3><p><strong>CPF:</strong> " + cliente.cpf + "</p><p><strong>E-mail:</strong> " + cliente.email + "</p><button onclick='excluirCliente(\"" + cliente.cpf + "\")' style='background-color: #e74c3c; color: white; border: none; padding: 5px 10px; font-size: 0.8rem; margin-top: 8px; cursor: pointer; border-radius: 4px; width: 100%; font-weight: bold;'>Excluir Cliente</button>";
        container.appendChild(card);
    });
}

function excluirCliente(cpfCliente) {
    if (confirm("Deseja remover permanentemente este cliente do sistema?")) {
        let listaUsuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
        listaUsuarios = listaUsuarios.filter(user => user.cpf !== cpfCliente);
        localStorage.setItem('usuarios', JSON.stringify(listaUsuarios));
        carregarClientes();
    }
}

function fazerLogout() {
    sessionStorage.removeItem('usuarioLogado');
    window.location.href = 'index.html';
}

async function buscarLivroAPI() {
    const termo = document.getElementById('input-busca').value.trim();
    const containerResultados = document.getElementById('resultados-livros');

    if (termo === '') {
        alert('Digite o título do livro que deseja buscar.');
        return;
    }
    
    containerResultados.innerHTML = '<p>Buscando livros no Open Library...</p>';

    try {
        const resposta = await fetch("https://openlibrary.org/search.json?q=" + encodeURIComponent(termo) + "&limit=10");
        const dados = await resposta.json();

        if (!dados.docs || dados.docs.length === 0) {
            containerResultados.innerHTML = '<p>Nenhum livro encontrado com esse título.</p>';
            return;
        }
        
        containerResultados.innerHTML = '';

        dados.docs.forEach(item => {
            const titulo = item.title || 'Título Desconhecido';
            const autor = item.author_name ? item.author_name[0] : 'Autor Desconhecido';
            const capaUrl = item.cover_i ? "https://covers.openlibrary.org/b/id/" + item.cover_i + "-M.jpg" : 'https://placehold.co/150x200?text=Sem+Capa';

            const card = document.createElement('div');
            card.className = 'card-livro';
            card.innerHTML = "<div><img src='" + capaUrl + "' alt='Capa'><h5>" + titulo + "</h5><p>" + autor + "</p></div><button class='btn-selecionar' onclick=\"selecionarLivro('" + titulo.replace(/'/g, "\\'") + "', '" + capaUrl + "')\">Selecionar para Empréstimo</button>";
            containerResultados.appendChild(card);
        });

    } catch (erro) {
        containerResultados.innerHTML = '<p style="color: red;">Erro ao conectar com a API.</p>';
    }
}

function selecionarLivro(titulo, capaUrl) {
    livroSelecionadoTemporario = { titulo: titulo, capa: capaUrl };
    document.getElementById('livro-selecionado-txt').innerText = "📖 " + titulo;
}

function finalizarEmprestimoCliente() {
    const usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado'));

    if (!usuarioLogado) {
        alert('Erro: Sessão expirada. Por favor, faça login novamente.');
        window.location.href = 'index.html';
        return;
    }

    if (!livroSelecionadoTemporario) {
        alert('Por favor, busque e selecione um livro na lista primeiro!');
        return;
    }
    
    const hoje = new Date();
    const dataDevolucao = new Date();
    dataDevolucao.setDate(hoje.getDate() + 7);

    const novoEmprestimo = {
        id: Date.now(),
        clienteNome: usuarioLogado.nome,
        livroTitulo: livroSelecionadoTemporario.titulo,
        livroCapa: livroSelecionadoTemporario.capa,
        dataEntrega: dataDevolucao.toLocaleDateString('pt-BR')
    };

    let listaEmprestimos = JSON.parse(localStorage.getItem('emprestimos')) || [];
    listaEmprestimos.push(novoEmprestimo);
    localStorage.setItem('emprestimos', JSON.stringify(listaEmprestimos));
    
    livroSelecionadoTemporario = null;
    document.getElementById('livro-selecionado-txt').innerText = "Nenhum livro selecionado ainda";
    
    alert("Empréstimo realizado com sucesso para o usuário: " + usuarioLogado.nome);
}

function carregarEmprestimosAdmin() {
    const container = document.getElementById('lista-emprestimos');
    if (!container) return;

    const listaEmprestimos = JSON.parse(localStorage.getItem('emprestimos')) || [];

    if (listaEmprestimos.length === 0) {
        container.innerHTML = '<p style="color: #999; font-style: italic;">Nenhum empréstimo ativo no momento.</p>';
        return;
    }

    container.innerHTML = '';

    listaEmprestimos.forEach(emp => {
        const card = document.createElement('div');
        card.className = 'card-emprestimo';
        card.innerHTML = "<img src='" + emp.livroCapa + "' alt='Capa'><div class='info-emp'><h4 style='margin: 0 0 5px 0;'>" + emp.livroTitulo + "</h4><p style='margin: 4px 0; font-size: 0.85rem;'><strong>Quem pegou:</strong> " + emp.clienteNome + "</p><p style='margin: 4px 0; font-size: 0.85rem; color: #e67e22;'>📅 Devolução: " + emp.dataEntrega + "</p><button onclick='baixarEmprestimo(" + emp.id + ")' style='background-color: #e74c3c; color: white; border: none; padding: 6px 12px; font-size: 0.8rem; margin-top: 8px; cursor: pointer; border-radius: 4px;'>Dar Baixa</button></div>";
        container.appendChild(card);
    });
}

function baixarEmprestimo(idEmprestimo) {
    if (confirm("Confirmar a devolução deste livro?")) {
        let listaEmprestimos = JSON.parse(localStorage.getItem('emprestimos')) || [];
        listaEmprestimos = listaEmprestimos.filter(emp => emp.id !== idEmprestimo);
        localStorage.setItem('emprestimos', JSON.stringify(listaEmprestimos));
        carregarEmprestimosAdmin();
    }
}