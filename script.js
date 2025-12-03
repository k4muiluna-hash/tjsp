// script.js - ADICIONE ISSO NO INÍCIO DO ARQUIVO
console.log("🔍 Script.js iniciado");

// Debug: verificar se firebase-config.js carregou
console.log("Firebase disponível?", typeof firebase !== 'undefined');
console.log("cidadesRef disponível?", typeof cidadesRef !== 'undefined');

if (typeof firebase === 'undefined') {
    console.error("❌ ERRO: Firebase não carregado!");
    document.body.innerHTML = `
        <div style="text-align: center; padding: 50px; color: red;">
            <h2>Erro: Firebase não carregado</h2>
            <p>Verifique se o arquivo firebase-config.js está sendo carregado antes do script.js</p>
            <p>Ordem correta no HTML:</p>
            <ol style="text-align: left; display: inline-block;">
                <li>firebase-app-compat.js</li>
                <li>firebase-database-compat.js</li>
                <li>firebase-config.js</li>
                <li>script.js</li>
            </ol>
        </div>
    `;
    throw new Error("Firebase não carregado");
}

// Continua com seu código...
document.addEventListener('DOMContentLoaded', function() {
    console.log("📄 DOMContentLoaded disparado");
    // Seu código continua...
});


// script.js
document.addEventListener('DOMContentLoaded', function () {
    // Elementos DOM
    const citiesList = document.getElementById('citiesList');
    const selectedCount = document.getElementById('selectedCount');
    const categoriesContainer = document.getElementById('categoriesContainer');
    const convocationsList = document.getElementById('convocationsList');
    const selectAllBtn = document.getElementById('selectAll');
    const clearAllBtn = document.getElementById('clearAll');
    const toggleThemeBtn = document.getElementById('toggleTheme');
    const filterEdition = document.getElementById('filterEdition');
    const filterDate = document.getElementById('filterDate');
    const applyFiltersBtn = document.getElementById('applyFilters');
    const candidateModal = document.getElementById('candidateModal');
    const closeModalBtn = document.querySelector('.close-modal');
    const closeModalBtn2 = document.querySelector('.btn-close-modal');

    // Estado da aplicação
    // Estado da aplicação
    let allData = {};
    let selectedCity = null; // MUDOU: Agora é apenas uma cidade
    let selectedCategories = new Set(['geral', 'negros', 'especiais']); // Todas selecionadas por padrão
    let lastConvocations = [];
    let currentFilters = {
        edition: 'all',
        date: null
    };

    // ===== INICIALIZAÇÃO =====
    initApp();

    // ===== FUNÇÕES PRINCIPAIS =====

    async function initApp() {
        console.log("🚀 Iniciando aplicação...");
        console.log("selectedCity inicial:", selectedCity);
        console.log("allData vazio?", Object.keys(allData).length === 0);

        try {
            // 1. Carregar dados do Firebase
            console.log("📡 Chamando loadDataFromFirebase()...");
            await loadDataFromFirebase();
            console.log("✅ loadDataFromFirebase concluído");
            console.log("Total de cidades carregadas:", Object.keys(allData).length);
            console.log("Cidades carregadas:", Object.keys(allData));

            // 2. Renderizar interface
            console.log("🎨 Renderizando lista de cidades...");
            renderCitiesList();
            console.log("🎨 Configurando event listeners...");
            setupEventListeners();
            console.log("🎨 Configurando tema...");
            setupTheme();

            // 3. Inicializar checkboxes
            console.log("✅ Inicializando checkboxes de categorias...");
            updateSelectedCategories();

            console.log("✅ Aplicação inicializada com sucesso!");

        } catch (error) {
            console.error("❌ ERRO na inicialização:", error);
            console.error("Stack trace:", error.stack);

            // Mostrar erro amigável
            citiesList.innerHTML = `
            <div style="color: red; padding: 20px; text-align: center;">
                <h3><i class="fas fa-exclamation-triangle"></i> Erro ao carregar</h3>
                <p>${error.message || "Erro desconhecido"}</p>
                <p>Verifique o console (F12) para detalhes.</p>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #4361ee; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    <i class="fas fa-redo"></i> Tentar Novamente
                </button>
            </div>
        `;
        }
    }

    function loadDataFromFirebase() {
    return new Promise((resolve, reject) => {
        console.log("📡 loadDataFromFirebase iniciada");
        console.log("cidadesRef:", cidadesRef);
        console.log("database:", database);
        
        if (!cidadesRef) {
            console.error("❌ cidadesRef não definido!");
            reject(new Error("Referência do Firebase não definida"));
            return;
        }
        
        console.log("📦 Buscando dados do Firebase...");
        
        cidadesRef.once('value')
            .then((snapshot) => {
                console.log("✅ Dados recebidos do Firebase");
                
                if (!snapshot.exists()) {
                    console.warn("⚠️  Snapshot existe mas está vazio");
                    allData = {};
                } else {
                    allData = snapshot.val();
                    console.log("📊 Dados convertidos para objeto");
                    console.log("Tipo de allData:", typeof allData);
                    console.log("Quantidade de cidades:", Object.keys(allData).length);
                    
                    if (Object.keys(allData).length === 0) {
                        console.warn("⚠️  Objeto allData vazio após conversão");
                    } else {
                        console.log("Primeira cidade:", Object.keys(allData)[0]);
                        console.log("Estrutura da primeira cidade:", allData[Object.keys(allData)[0]]);
                    }
                }
                
                // Extrair edições únicas para o filtro
                const editions = extractUniqueEditions();
                console.log("Edições encontradas:", editions.length);
                populateEditionFilter(editions);
                
                // Encontrar últimos convocados
                findLastConvocations();
                
                console.log("✅ loadDataFromFirebase concluída com sucesso");
                resolve();
                
            })
            .catch((error) => {
                console.error("❌ ERRO no Firebase:", error);
                console.error("Código do erro:", error.code);
                console.error("Mensagem:", error.message);
                reject(error);
            });
        });
    }

    function extractUniqueEditions() {
        const editions = new Set();

        for (const cidade in allData) {
            const categorias = allData[cidade];

            for (const categoria in categorias) {
                if (['especiais', 'negros', 'geral'].includes(categoria)) {
                    const candidatos = categorias[categoria];

                    candidatos.forEach(candidato => {
                        if (candidato.Edicao) {
                            editions.add(candidato.Edicao);
                        }
                    });
                }
            }
        }

        return Array.from(editions).sort();
    }

    function populateEditionFilter(editions) {
        filterEdition.innerHTML = '<option value="all">Todas</option>';

        editions.forEach(edition => {
            const option = document.createElement('option');
            option.value = edition;
            option.textContent = edition;
            filterEdition.appendChild(option);
        });
    }

    function renderSelectedCityContent() {
        const noCitySelected = document.getElementById('noCitySelected');
        const categoriesContainer = document.getElementById('categoriesContainer');

        if (!selectedCity) {
            // Mostrar mensagem "selecione uma cidade"
            noCitySelected.style.display = 'flex';
            categoriesContainer.innerHTML = '';
            return;
        }

        // Esconder mensagem
        noCitySelected.style.display = 'none';

        // Renderizar conteúdo da cidade selecionada
        const cidadeData = allData[selectedCity];
        if (!cidadeData) return;

        // Header da cidade
        categoriesContainer.innerHTML = `
        <div class="selected-city-header">
            <h2>
                <i class="fas fa-city"></i>
                ${selectedCity}
                <small style="opacity: 0.8; font-size: 1rem;">
                    (${countTotalCandidates(selectedCity)} candidatos)
                </small>
            </h2>
            <button class="btn-change-city" id="changeCity">
                <i class="fas fa-exchange-alt"></i> Trocar Cidade
            </button>
        </div>
        <div class="categories-grid" id="categoriesGrid"></div>
    `;

        // Adicionar evento ao botão "Trocar Cidade"
        document.getElementById('changeCity').addEventListener('click', () => {
            selectedCity = null;
            renderCitiesList();
            renderSelectedCityContent();
            updateSelectedCount();
        });

        // Renderizar as categorias selecionadas
        renderSelectedCategories();
    }

    function countTotalCandidates(cidade) {
        let total = 0;
        const categorias = allData[cidade];

        if (!categorias) return 0;

        ['geral', 'negros', 'especiais'].forEach(cat => {
            if (categorias[cat]) {
                total += categorias[cat].length;
            }
        });

        return total;
    }

    function renderSelectedCategories() {
        const categoriesGrid = document.getElementById('categoriesGrid');
        if (!categoriesGrid) return;

        categoriesGrid.innerHTML = '';

        const cidadeData = allData[selectedCity];
        if (!cidadeData) return;

        // Mapeamento das categorias
        const categoryMap = {
            'geral': { key: 'geral', label: 'Ampla Concorrência (AC)', color: '#4cc9f0', icon: 'fa-users' },
            'negros': { key: 'negros', label: 'Pretos e Pardos (PPP)', color: '#7209b7', icon: 'fa-user-tag' },
            'especiais': { key: 'especiais', label: 'Pessoas com Deficiência (PCD)', color: '#f72585', icon: 'fa-wheelchair' }
        };

        // Renderizar apenas as categorias selecionadas
        Array.from(selectedCategories).forEach(catKey => {
            if (cidadeData[catKey]) {
                const categoryCard = createCategoryCard(selectedCity, catKey, cidadeData[catKey]);
                categoriesGrid.appendChild(categoryCard);
            }
        });

        // Se não há categorias selecionadas, mostrar mensagem
        if (selectedCategories.size === 0) {
            categoriesGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fas fa-filter fa-3x"></i>
                <h3>Nenhuma categoria selecionada</h3>
                <p>Marque pelo menos uma categoria nos filtros acima</p>
            </div>
        `;
        }
    }

    // ===== RENDERIZAÇÃO =====

    function renderCitiesList() {
    console.log("🎨 renderCitiesList executando...");
    console.log("selectedCity atual:", selectedCity);
    console.log("Quantidade de cidades em allData:", Object.keys(allData).length);
    
    citiesList.innerHTML = '';

    Object.keys(allData).sort().forEach(cidade => {
        const cityItem = document.createElement('div');
        cityItem.className = `city-item ${selectedCity === cidade ? 'selected' : ''}`;
        cityItem.dataset.city = cidade;

        // Contar candidatos por categoria nesta cidade
        const counts = countCandidatesByCategory(cidade);

        cityItem.innerHTML = `
            <div class="city-info">
                <input type="radio" name="selectedCity" class="city-radio" 
                       ${selectedCity === cidade ? 'checked' : ''}
                       value="${cidade}">
                <span class="city-name">${cidade}</span>
                <span class="city-stats">
                    (${counts.total} candidatos)
                </span>
            </div>
            <div class="city-categories">
                <span class="category-tag" style="background-color: #4cc9f0;">
                    AC: ${counts.geral || 0}
                </span>
                <span class="category-tag" style="background-color: #7209b7;">
                    PPP: ${counts.negros || 0}
                </span>
                <span class="category-tag" style="background-color: #f72585;">
                    PCD: ${counts.especiais || 0}
                </span>
            </div>
        `;

        // Event listeners para a cidade
        const radio = cityItem.querySelector('.city-radio');
        radio.addEventListener('change', () => {
            console.log("📍 Cidade selecionada:", cidade);
            toggleCitySelection(cidade);
        });

        cityItem.addEventListener('click', (e) => {
            if (e.target !== radio) {
                radio.checked = !radio.checked;
                radio.dispatchEvent(new Event('change'));
            }
        });

        citiesList.appendChild(cityItem);
        });

        updateSelectedCount();
    }

    function countCandidatesByCategory(cidade) {
        const counts = { total: 0 };
        const categorias = allData[cidade];

        if (!categorias) return counts;

        ['geral', 'negros', 'especiais'].forEach(cat => {
            if (categorias[cat]) {
                counts[cat] = categorias[cat].length;
                counts.total += categorias[cat].length;
            }
        });

        return counts;
    }

    function renderCategories() {
        if (selectedCities.size === 0) {
            categoriesContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-city fa-3x"></i>
                    <h3>Selecione uma ou mais cidades</h3>
                    <p>Escolha cidades na sidebar para visualizar os candidatos</p>
                </div>
            `;
            return;
        }

        categoriesContainer.innerHTML = '';

        // Para cada cidade selecionada
        Array.from(selectedCities).forEach(cidade => {
            const cidadeData = allData[cidade];
            if (!cidadeData) return;

            const cidadeSection = document.createElement('div');
            cidadeSection.className = 'city-section';

            // Header da cidade
            const header = document.createElement('div');
            header.className = 'city-section-header';
            header.innerHTML = `
                <h3><i class="fas fa-city"></i> ${cidade}</h3>
                <button class="btn-expand" data-city="${cidade}">
                    <i class="fas fa-chevron-down"></i>
                </button>
            `;

            cidadeSection.appendChild(header);

            // Container das categorias
            const categoriesGrid = document.createElement('div');
            categoriesGrid.className = 'categories-grid';
            categoriesGrid.id = `categories-${cidade}`;

            // Card para cada categoria
            const categories = [
                { key: 'geral', label: 'Ampla Concorrência (AC)', color: '#4cc9f0', icon: 'fa-users' },
                { key: 'negros', label: 'Pretos e Pardos (PPP)', color: '#7209b7', icon: 'fa-user-tag' },
                { key: 'especiais', label: 'Pessoas com Deficiência (PCD)', color: '#f72585', icon: 'fa-wheelchair' }
            ];

            categories.forEach(cat => {
                if (cidadeData[cat]) {
                    const categoryCard = createCategoryCard(cidade, cat, cidadeData[cat]);
                    categoriesGrid.appendChild(categoryCard);
                }
            });

            cidadeSection.appendChild(categoriesGrid);
            categoriesContainer.appendChild(cidadeSection);

            // Event listener para expandir/recolher
            header.querySelector('.btn-expand').addEventListener('click', (e) => {
                const grid = document.getElementById(`categories-${cidade}`);
                const icon = e.target.closest('.btn-expand').querySelector('i');

                if (grid.style.display === 'none') {
                    grid.style.display = 'grid';
                    icon.className = 'fas fa-chevron-down';
                } else {
                    grid.style.display = 'none';
                    icon.className = 'fas fa-chevron-right';
                }
            });
        });
    }

    function createCategoryCard(cidade, categoria, candidatos) {
        const card = document.createElement('div');
        card.className = 'category-card';

        // Filtrar candidatos se houver filtros aplicados
        let filteredCandidates = candidatos;
        if (currentFilters.edition !== 'all') {
            filteredCandidates = candidatos.filter(c => c.Edicao === currentFilters.edition);
        }
        if (currentFilters.date) {
            filteredCandidates = filteredCandidates.filter(c => c.Data === currentFilters.date);
        }

        // ORDENAÇÃO INVERSA: Últimos convocados primeiro
        // Primeiro separa convocados e não convocados
        const convocados = filteredCandidates.filter(c => c.Conv_DJE === "Sim");
        const naoConvocados = filteredCandidates.filter(c => c.Conv_DJE !== "Sim");
        
        // Ordena convocados por classificação INVERSA (últimos primeiro)
        convocados.sort((a, b) => {
            const aClass = parseInt(a.Classif_Final) || 999;
            const bClass = parseInt(b.Classif_Final) || 999;
            return bClass - aClass; // INVERTIDO: maior número primeiro
        });
        
        // Ordena não convocados normalmente
        naoConvocados.sort((a, b) => {
            const aClass = parseInt(a.Classif_Final) || 999;
            const bClass = parseInt(b.Classif_Final) || 999;
            return aClass - bClass; // Normal: menor número primeiro
        });
        
        // Junta as listas: convocados (invertidos) primeiro, depois não convocados
        filteredCandidates = [...convocados, ...naoConvocados];

        // Pegar top 5 para mostrar no card (já na ordem correta)
        const topCandidates = filteredCandidates.slice(0, 5);

        const categoryConfig = {
            'geral': { label: 'AC', color: '#4cc9f0', icon: 'fa-users' },
            'negros': { label: 'PPP', color: '#7209b7', icon: 'fa-user-tag' },
            'especiais': { label: 'PCD', color: '#f72585', icon: 'fa-wheelchair' }
        }[categoria];

        card.innerHTML = `
            <div class="category-header" style="background-color: ${categoryConfig.color}20; border-left: 4px solid ${categoryConfig.color};">
                <div class="category-title">
                    <i class="fas ${categoryConfig.icon}"></i>
                    <h4>${categoryConfig.label}</h4>
                </div>
                <span class="category-count">
                    ${convocados.length} convocados / ${filteredCandidates.length} total
                </span>
            </div>
            <div class="category-body">
                ${topCandidates.length > 0 ?
                    topCandidates.map(c => `
                        <div class="candidate-item" data-cidade="${cidade}" data-categoria="${categoria}" data-id="${c.Inscrição}">
                            <div class="candidate-info">
                                <strong>${c.Nome.split(' ')[0]} ${c.Nome.split(' ')[1] || ''}</strong>
                                <span class="candidate-class ${c.Conv_DJE === 'Sim' ? 'convocado' : ''}">
                                    ${c.Classif_Final}
                                    ${c.Conv_DJE === 'Sim' ? ' ✅' : ''}
                                </span>
                            </div>
                            <div class="candidate-meta">
                                <small>${c.Edicao || 'N/A'}</small>
                                <small>${c.Data || 'N/A'}</small>
                            </div>
                            ${c.Conv_DJE === "Sim" ? 
                                '<span class="conv-indicator" title="Convocado">📢 Última convocação</span>' : 
                                ''
                            }
                        </div>
                    `).join('') :
                    '<p class="no-candidates">Nenhum candidato encontrado</p>'
                }
                ${filteredCandidates.length > 5 ? 
                    `<div class="view-more">
                        <button class="btn-view-more" data-cidade="${cidade}" data-categoria="${categoria}">
                            Ver mais ${filteredCandidates.length - 5} candidatos
                        </button>
                    </div>` : 
                    ''
                }
            </div>
        `;

        // Adicionar event listeners
        setTimeout(() => {
            card.querySelectorAll('.candidate-item').forEach(item => {
                item.addEventListener('click', () => {
                    const cidade = item.dataset.cidade;
                    const categoria = item.dataset.categoria;
                    const id = item.dataset.id;
                    showCandidateModal(cidade, categoria, id);
                });
            });

            const viewMoreBtn = card.querySelector('.btn-view-more');
            if (viewMoreBtn) {
                viewMoreBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const cidade = viewMoreBtn.dataset.cidade;
                    const categoria = viewMoreBtn.dataset.categoria;
                    showAllCandidatesModal(cidade, categoria);
                });
            }
        }, 0);

        return card;
    }

    function renderLastConvocations() {
    convocationsList.innerHTML = '';

    if (lastConvocations.length === 0) {
        convocationsList.innerHTML = `
            <div class="empty-convocations">
                <i class="fas fa-info-circle"></i>
                Nenhum convocado encontrado
            </div>
        `;
        return;
    }

    // DEBUG: Mostrar as datas das últimas convocações
    console.log("Últimas convocações encontradas:");
    lastConvocations.slice(0, 5).forEach((conv, i) => {
        if (conv.timestamp) {
            const dataObj = new Date(conv.timestamp);
            console.log(`${i+1}. ${conv.Nome} - Data original: ${conv.Data} - Data convertida: ${dataObj.toLocaleDateString('pt-BR')}`);
        }
    });

    // Pegar ÚLTIMOS 3 convocados (mais recentes)
    const lastThree = lastConvocations.slice(0, 3);

    lastThree.forEach((conv, index) => {
        const convItem = document.createElement('div');
        convItem.className = 'convocation-item';

        // Formatar data para exibição corretamente
        let dataFormatada = conv.Data || 'Sem data';
        if (conv.timestamp) {
            const dataObj = new Date(conv.timestamp);
            if (!isNaN(dataObj.getTime())) {
                // Garantir que estamos usando a data correta
                dataFormatada = dataObj.getUTCDate().toString().padStart(2, '0') + '/' + 
                               (dataObj.getUTCMonth() + 1).toString().padStart(2, '0') + '/' + 
                               dataObj.getUTCFullYear();
            }
        }

        convItem.innerHTML = `
            <div class="convocation-position">
                <span class="position-badge ${index === 0 ? 'first' : index === 1 ? 'second' : 'third'}">
                    ${index + 1}º
                </span>
            </div>
            <div class="convocation-header">
                <i class="fas fa-user-graduate"></i>
                <div>
                    <h4>${conv.Nome}</h4>
                    <small>${conv.Cidade} • ${conv.categoria === 'geral' ? 'AC' : conv.categoria === 'negros' ? 'PPP' : 'PCD'}</small>
                </div>
            </div>
            <div class="convocation-details">
                <span class="badge-class">${conv.Classif_Final}</span>
                <span class="badge-date">
                    <i class="far fa-calendar"></i> ${dataFormatada}
                </span>
            </div>
            <button class="btn-view-candidate" 
                    data-cidade="${conv.Cidade}" 
                    data-categoria="${conv.categoria}"
                    data-id="${conv.Inscrição}">
                <i class="fas fa-eye"></i>
            </button>
        `;

        convocationsList.appendChild(convItem);
    });


        // Event listeners para os botões de visualização
        setTimeout(() => {
            convocationsList.querySelectorAll('.btn-view-candidate').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const cidade = btn.dataset.cidade;
                    const categoria = btn.dataset.categoria;
                    const id = btn.dataset.id;
                    showCandidateModal(cidade, categoria, id);
                });
            });
        }, 0);
    }

    function showAllConvocationsModal() {
        document.getElementById('modalTitle').textContent = `Todas as convocações (${lastConvocations.length})`;
        
        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <div class="all-convocations">
                <div class="table-container">
                    <table class="convocations-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Candidato</th>
                                <th>Cidade</th>
                                <th>Categoria</th>
                                <th>Class.</th>
                                <th>Data</th>
                                <th>Edição</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${lastConvocations.map((conv, index) => `
                                <tr class="convocation-row" 
                                    data-cidade="${conv.Cidade}" 
                                    data-categoria="${conv.categoria}"
                                    data-id="${conv.Inscrição}">
                                    <td class="position-cell">
                                        <span class="position-badge ${index < 3 ? 'top-' + (index + 1) : ''}">
                                            ${index + 1}º
                                        </span>
                                    </td>
                                    <td class="name-cell">
                                        <strong>${conv.Nome}</strong>
                                        <small>${conv.Inscrição}</small>
                                    </td>
                                    <td>${conv.Cidade}</td>
                                    <td>
                                        <span class="category-mini-badge ${conv.categoria}">
                                            ${conv.categoria === 'geral' ? 'AC' : conv.categoria === 'negros' ? 'PPP' : 'PCD'}
                                        </span>
                                    </td>
                                    <td><strong>${conv.Classif_Final}</strong></td>
                                    <td>${conv.Data || '-'}</td>
                                    <td>${conv.Edicao || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="convocations-stats">
                    <div class="stat-card">
                        <i class="fas fa-city"></i>
                        <h3>${new Set(lastConvocations.map(c => c.Cidade)).size}</h3>
                        <p>Cidades</p>
                    </div>
                    <div class="stat-card">
                        <i class="fas fa-users"></i>
                        <h3>${lastConvocations.length}</h3>
                        <p>Total Convocados</p>
                    </div>
                    <div class="stat-card">
                        <i class="fas fa-calendar-alt"></i>
                        <h3>${new Set(lastConvocations.map(c => c.Edicao).filter(Boolean)).size}</h3>
                        <p>Edições</p>
                    </div>
                </div>
            </div>
        `;
    
        candidateModal.style.display = 'block';
        
        // Event listeners para as linhas
        setTimeout(() => {
            modalBody.querySelectorAll('.convocation-row').forEach(row => {
                row.addEventListener('click', () => {
                    const cidade = row.dataset.cidade;
                    const categoria = row.dataset.categoria;
                    const id = row.dataset.id;
                    showCandidateModal(cidade, categoria, id);
                });
            });
        }, 0);
    }

    // ===== FUNÇÕES DE UTILIDADE =====

    function toggleCitySelection(cidade) {
        // Se já está selecionada, deseleciona
        if (selectedCity === cidade) {
            selectedCity = null;
        } else {
            // Seleciona a nova cidade (substitui a anterior)
            selectedCity = cidade;
        }

        updateSelectedCount();
        renderCitiesList();
        renderSelectedCityContent();
    }

    function updateSelectedCount() {
        if (selectedCity) {
            selectedCount.textContent = `1 selecionada`;
            selectedCount.style.backgroundColor = 'var(--primary-color)';
        } else {
            selectedCount.textContent = `0 selecionadas`;
            selectedCount.style.backgroundColor = 'var(--gray-color)';
        }
    }

    function findLastConvocations() {
    lastConvocations = [];

    for (const cidade in allData) {
        const categorias = allData[cidade];

        for (const categoria in categorias) {
            if (['especiais', 'negros', 'geral'].includes(categoria)) {
                const candidatos = categorias[categoria];

                candidatos.forEach(candidato => {
                    if (candidato.Conv_DJE === "Sim") {
                        let timestamp = 0;
                        
                        if (candidato.Data) {
                            // Tentar diferentes formatos de data
                            timestamp = parseDateToTimestamp(candidato.Data);
                        }
                        
                        const convocado = { 
                            ...candidato, 
                            categoria,
                            timestamp: timestamp
                        };
                        lastConvocations.push(convocado);
                    }
                });
            }
        }
    }

    // ORDENAÇÃO: Por data (mais recente primeiro)
    lastConvocations.sort((a, b) => {
        // Primeiro ordena por timestamp (mais recente primeiro)
        const dateDiff = b.timestamp - a.timestamp;
        
        // Se as datas forem iguais (empate), ordena por nome
        if (dateDiff === 0) {
            return a.Nome.localeCompare(b.Nome);
        }
        
        return dateDiff;
    });

    renderLastConvocations();
}

// Função auxiliar para converter data para timestamp
// Função auxiliar para converter data para timestamp (corrigindo fuso horário)
function parseDateToTimestamp(dateString) {
    if (!dateString) return 0;
    
    // Remover espaços extras
    dateString = dateString.trim();
    
    // Tentar diferentes formatos
    let date;
    
    // Formato dd/mm/yyyy ou dd-mm-yyyy
    if (dateString.includes('/') || dateString.includes('-')) {
        const parts = dateString.split(/[\/\-]/);
        
        if (parts.length === 3) {
            let day, month, year;
            
            // Se o primeiro parte tem 4 dígitos, assume yyyy-mm-dd
            if (parts[0].length === 4) {
                year = parseInt(parts[0]);
                month = parseInt(parts[1]) - 1; // Mês em JavaScript é 0-indexed
                day = parseInt(parts[2]);
            } 
            // Se o último parte tem 4 dígitos, assume dd-mm-yyyy ou dd/mm/yyyy
            else if (parts[2].length === 4) {
                day = parseInt(parts[0]);
                month = parseInt(parts[1]) - 1; // Mês em JavaScript é 0-indexed
                year = parseInt(parts[2]);
            }
            // Se o último parte tem 2 dígitos, assume dd-mm-yy
            else if (parts[2].length === 2) {
                day = parseInt(parts[0]);
                month = parseInt(parts[1]) - 1; // Mês em JavaScript é 0-indexed
                year = parseInt(parts[2]) + 2000; // Assume século 21
            }
            
            // Criar data usando UTC para evitar problemas de fuso horário
            if (day && month !== undefined && year) {
                date = new Date(Date.UTC(year, month, day));
                console.log(`Data parseada: ${dateString} -> UTC Date: ${date.toISOString()}`);
                return date.getTime();
            }
        }
    }
    
    // Se não conseguiu parsear nos formatos acima, tenta usar o construtor Date
    date = new Date(dateString);
    
    // Se for válido, ajusta para UTC para evitar problemas de timezone
    if (!isNaN(date.getTime())) {
        // Ajustar para UTC para evitar mudança de dia
        const utcDate = new Date(Date.UTC(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        ));
        console.log(`Data genérica: ${dateString} -> UTC Date: ${utcDate.toISOString()}`);
        return utcDate.getTime();
    }
    
    console.warn(`Data inválida: ${dateString}`);
    return 0;
}

    // Função auxiliar para extrair número da classificação
    function extractNumberFromClassification(classif) {
        if (!classif) return 999;
        const match = classif.match(/\d+/);
        return match ? parseInt(match[0]) : 999;
    }

    // ===== MODAL FUNCTIONS =====

    function showCandidateModal(cidade, categoria, id) {
        const candidatos = allData[cidade][categoria];
        const candidato = candidatos.find(c => c.Inscrição === id);

        if (!candidato) return;

        document.getElementById('modalTitle').textContent = candidato.Nome;

        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
        <div class="candidate-details">
            <div class="detail-group">
                <label><i class="fas fa-id-card"></i> Inscrição:</label>
                <span>${candidato.Inscrição}</span>
            </div>
            <div class="detail-group">
                <label><i class="fas fa-map-marker-alt"></i> Cidade:</label>
                <span>${candidato.Cidade}</span>
            </div>
            <div class="detail-group">
                <label><i class="fas fa-trophy"></i> Classificação:</label>
                <span>${candidato.Classif_Final}</span>
            </div>
            <div class="detail-group">
                <label><i class="fas fa-star"></i> Nota Final:</label>
                <span>${candidato.Nota_Final}</span>
            </div>
            <div class="detail-group">
                <label><i class="fas fa-calendar"></i> Edição:</label>
                <span class="${!candidato.Edicao ? 'empty-field' : ''}">
                    ${candidato.Edicao || 'Não informada'}
                </span>
            </div>
            <div class="detail-group">
                <label><i class="fas fa-clock"></i> Data:</label>
                <span class="${!candidato.Data ? 'empty-field' : ''}">
                    ${candidato.Data || 'Não informada'}
                </span>
            </div>
            <div class="detail-group">
                <label><i class="fas fa-check-circle"></i> Status:</label>
                <span class="status-badge ${candidato.Conv_DJE === 'Sim' ? 'convocado' : 'nao-convocado'}">
                    ${candidato.Conv_DJE === 'Sim' ? '✅ Convocado' : '⏳ Aguardando'}
                </span>
            </div>
            <div class="detail-group">
                <label><i class="fas fa-user-tag"></i> Categoria:</label>
                <span class="category-badge">
                    ${categoria === 'geral' ? 'AC' : categoria === 'negros' ? 'PPP' : 'PCD'}
                </span>
            </div>
        </div>
    `;

        candidateModal.style.display = 'block';
    }

    function showAllCandidatesModal(cidade, categoria) {
        const candidatos = allData[cidade][categoria];

        document.getElementById('modalTitle').textContent = `Todos os candidatos - ${cidade} - ${categoria === 'geral' ? 'AC' : categoria === 'negros' ? 'PPP' : 'PCD'}`;

        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <div class="full-list">
                <table class="candidates-table">
                    <thead>
                        <tr>
                            <th>Class.</th>
                            <th>Nome</th>
                            <th>Inscrição</th>
                            <th>Nota</th>
                            <th>Edição</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${candidatos.map(c => `
                            <tr class="candidate-row" data-id="${c.Inscrição}">
                                <td><strong>${c.Classif_Final}</strong></td>
                                <td>${c.Nome}</td>
                                <td><small>${c.Inscrição}</small></td>
                                <td>${c.Nota_Final}</td>
                                <td>${c.Edicao || '-'}</td>
                                <td>
                                    <span class="status-indicator ${c.Conv_DJE === 'Sim' ? 'active' : ''}">
                                        ${c.Conv_DJE === 'Sim' ? 'Convocado' : 'Aguardando'}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        candidateModal.style.display = 'block';

        // Adicionar event listeners para as linhas
        setTimeout(() => {
            modalBody.querySelectorAll('.candidate-row').forEach(row => {
                row.addEventListener('click', () => {
                    const id = row.dataset.id;
                    showCandidateModal(cidade, categoria, id);
                });
            });
        }, 0);
    }

    // ===== EVENT LISTENERS =====

    function setupEventListeners() {
        // Botões de seleção (agora selecionam apenas uma)
        selectAllBtn.addEventListener('click', () => {
            // Seleciona a primeira cidade como exemplo
            const firstCity = Object.keys(allData)[0];
            if (firstCity) {
                selectedCity = firstCity;
                updateSelectedCount();
                renderCitiesList();
                renderSelectedCityContent();
            }
        });

        clearAllBtn.addEventListener('click', () => {
            selectedCity = null;
            updateSelectedCount();
            renderCitiesList();
            renderSelectedCityContent();
        });

        // Toggle tema
        toggleThemeBtn.addEventListener('click', toggleTheme);

        // Checkboxes de categorias
        document.getElementById('filterAC').addEventListener('change', updateSelectedCategories);
        document.getElementById('filterPPP').addEventListener('change', updateSelectedCategories);
        document.getElementById('filterPCD').addEventListener('change', updateSelectedCategories);

        // Filtros
        applyFiltersBtn.addEventListener('click', () => {
            currentFilters.edition = filterEdition.value;
            currentFilters.date = filterDate.value || null;

            if (selectedCity) {
                renderSelectedCategories();
            }
            findLastConvocations();
        });

        // Modal
        closeModalBtn.addEventListener('click', () => {
            candidateModal.style.display = 'none';
        });

        closeModalBtn2.addEventListener('click', () => {
            candidateModal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === candidateModal) {
                candidateModal.style.display = 'none';
            }
        });
    }

    function updateSelectedCategories() {
        selectedCategories.clear();

        if (document.getElementById('filterAC').checked) {
            selectedCategories.add('geral');
        }
        if (document.getElementById('filterPPP').checked) {
            selectedCategories.add('negros');
        }
        if (document.getElementById('filterPCD').checked) {
            selectedCategories.add('especiais');
        }

        // Atualizar a exibição se uma cidade estiver selecionada
        if (selectedCity) {
            renderSelectedCategories();
        }
    }

    function setupTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    }

    function updateThemeIcon(theme) {
        const icon = toggleThemeBtn.querySelector('i');
        icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

});

