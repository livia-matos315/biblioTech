let livroSelecionadoTemporario = null;

function fazerLogin() {
    if (window.event) window.event.preventDefault();

    const usuario = document.getElementById('name').value.trim();
    const cpf = document.getElementById('cpf').value.trim();
    const email = document.getElementById('email').value.trim();

    if (usuario.length >= 3 && cpf.length === 11 && email !== '') {
        const dadosUsuario = {
            nome: usuario,
            cpf: cpf,
            email: email
        };
        
        let listaClientes = JSON.parse(localStorage.getItem("clientes")) || [];
        const jaCadastrado = listaClientes.some(cliente => cliente.cpf === cpf);
        
        if (!jaCadastrado) {
            listaClientes.push(dadosUsuario);
            localStorage.setItem("clientes", JSON.stringify(listaClientes));
            alert("Cliente cadastrado com sucesso!");
            
            document.getElementById('name').value = '';
            document.getElementById('cpf').value = '';
            document.getElementById('email').value = '';
            
            carregarClientes();
            popularSelectClientes();
        } else {
            alert("Este CPF já está cadastrado!");
        }
    } else {
        alert("Por favor, preencha os campos corretamente! O CPF deve ter 11 dígitos.");
    }
}

window.onload = function () {
    carregarClientes();
    popularSelectClientes();
    carregarEmprestimosVisual();
};

function carregarClientes() {
    const container = document.getElementById('lista-clientes');
    if (!container) return;

    const listaClientes = JSON.parse(localStorage.getItem('clientes')) || [];

    if (listaClientes.length === 0) {
        container.innerHTML = '<p class="sem-clientes" style="color: #999; font-style: italic;">Nenhum cliente cadastrado ainda.</p>';
        return;
    }
    
    container.innerHTML = '';
    listaClientes.forEach(cliente => {
        const card = document.createElement('div');
        card.className = 'card-cliente';
        card.innerHTML = `
            <h3>${cliente.nome}</h3>
            <p><strong>CPF:</strong> ${cliente.cpf}</p>
            <p><strong>E-mail:</strong> ${cliente.email}</p>
        `;
        container.appendChild(card);
    });
}

function popularSelectClientes() {
    const select = document.getElementById('select-clientes');
    if (!select) return;

    select.innerHTML = '<option value="">-- Escolha um cliente --</option>';

    const listaClientes = JSON.parse(localStorage.getItem('clientes')) || [];

    listaClientes.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente.nome;
        option.textContent = cliente.nome;
        select.appendChild(option);
    });
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
        // Faz a requisição limitando a 10 resultados para melhor performance
        const resposta = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(termo)}&limit=10`);
        const dados = await resposta.json();

        if (!dados.docs || dados.docs.length === 0) {
            containerResultados.innerHTML = '<p>Nenhum livro encontrado com esse título.</p>';
            return;
        }
        
        containerResultados.innerHTML = '';

        dados.docs.forEach(item => {
            const titulo = item.title || 'Título Desconhecido';
            // Pega o primeiro autor cadastrado na lista
            const autor = item.author_name ? item.author_name[0] : 'Autor Desconhecido';

            // Constrói a URL da imagem caso o livro possua um ID de capa cadastrado
            const capaUrl = item.cover_i
                ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg`
                : 'https://placehold.co/150x200?text=Sem+Capa';

            const card = document.createElement('div');
            card.className = 'card-livro';
            card.innerHTML = `
                <div>
                    <img src="${capaUrl}" alt="Capa do livro">
                    <h5>${titulo}</h5>
                    <p>${autor}</p>
                </div>
                <button class="btn-selecionar" onclick="selecionarLivro('${titulo.replace(/'/g, "\\'")}', '${capaUrl}')">Selecionar para Empréstimo</button>
            `;
            containerResultados.appendChild(card);
        });

    } catch (erro) {
        console.error(erro);
        containerResultados.innerHTML = '<p style="color: red;">Erro ao conectar com a API do Open Library. Verifique sua internet.</p>';
    }
}

function selecionarLivro(titulo, capaUrl) {
    livroSelecionadoTemporario = { titulo: titulo, capa: capaUrl };
    document.getElementById('livro-selecionado-txt').innerText = `📖 ${titulo}`;
}

function finalizarEmprestimo() {
    const clienteEscolhido = document.getElementById('select-clientes').value;

    if (!clienteEscolhido) {
        alert('Por favor, selecione um cliente na lista!');
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
        clienteNome: clienteEscolhido,
        livroTitulo: livroSelecionadoTemporario.titulo,
        livroCapa: livroSelecionadoTemporario.capa,
        dataEntrega: dataDevolucao.toLocaleDateString('pt-BR')
    };

    let listaEmprestimos = JSON.parse(localStorage.getItem('emprestimos')) || [];
    listaEmprestimos.push(novoEmprestimo);
    localStorage.setItem('emprestimos', JSON.stringify(listaEmprestimos));
    
    livroSelecionadoTemporario = null;
    document.getElementById('livro-selecionado-txt').innerText = "Nenhum livro selecionado ainda";
    
    alert('Empréstimo realizado com sucesso!');
    carregarEmprestimosVisual(); 
}

function carregarEmprestimosVisual() {
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
        card.innerHTML = `
            <img src="${emp.livroCapa}" alt="Capa">
            <div class="info-emp" style="flex: 1;">
                <h4>${emp.livroTitulo}</h4>
                <p><strong>Cliente:</strong> ${emp.clienteNome}</p>
                <p class="data-alerta">📅 Devolução: ${emp.dataEntrega}</p>
                <button onclick="devolverLivro(${emp.id})" style="background-color: #e74c3c; color: white; border: none; padding: 4px 10px; font-size: 0.8rem; margin-top: 5px; cursor: pointer; border-radius: 4px;">Devolver</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function devolverLivro(idEmprestimo) {
    if (confirm("Confirmar a devolução deste livro?")) {
        let listaEmprestimos = JSON.parse(localStorage.getItem('emprestimos')) || [];
        listaEmprestimos = listaEmprestimos.filter(emp => emp.id !== idEmprestimo);
        localStorage.setItem('emprestimos', JSON.stringify(listaEmprestimos));
        carregarEmprestimosVisual();
    }
}