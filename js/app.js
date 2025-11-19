// =======================================================
// DATOS GLOBALES Y CONSTANTES NUTRICIONALES
// =======================================================

const grupoNutrientesBase = {
    cereales: { kcal: 140, prot: 3, cho: 30, lip: 1 },
    verduras: { kcal: 25, prot: 2, cho: 4, lip: 0 },
    frutas: { kcal: 65, prot: 1, cho: 15, lip: 0 },
    lacteos: { kcal: 120, prot: 8, cho: 12, lip: 5 },
    carnes: { kcal: 75, prot: 7, cho: 0, lip: 5 },
    leguminosas: { kcal: 100, prot: 7, cho: 17, lip: 1 },
    lipidos: { kcal: 45, prot: 0, cho: 0, lip: 5 },
    aceites: { kcal: 45, prot: 0, cho: 0, lip: 5 },
    azucares: { kcal: 20, prot: 0, cho: 5, lip: 0 },
};

let requerimientos = {
    kcal: 2000,
    prot: 80,
    cho: 250,
    lip: 60
};

let userSelections = {};
let allFoods = {};

const tabButtons = document.querySelectorAll(".tab-btn");
const tabContent = document.getElementById("tab-content");

// =======================================================
// CARGA DE ALIMENTOS
// =======================================================

async function loadFoods() {
    try {
        const res = await fetch("./data/alimentos.json");
        return await res.json();
    } catch (error) {
        console.error("❌ Error cargando alimentos.json:", error);
        return {};
    }
}

// =======================================================
// TABS
// =======================================================

tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        document.querySelector(".tab-btn.active").classList.remove("active");
        btn.classList.add("active");

        const selectedTab = btn.dataset.tab;

        if (selectedTab === "resumen") {
            renderSummary();
            return;
        }

        loadFoodFamily(allFoods, selectedTab);
    });
});

// =======================================================
// MOSTRAR ALIMENTOS POR CATEGORÍA
// =======================================================

function loadFoodFamily(allFoods, familyName) {
    const items = allFoods[familyName];

    if (!items) {
        tabContent.innerHTML = "<p>No hay alimentos disponibles para esta categoría.</p>";
        return;
    }

    tabContent.innerHTML = `<h2>${capitalize(familyName)}</h2>`;

    items.forEach((item) => {
        const div = document.createElement("div");
        div.classList.add("food-item");

        const currentValue = userSelections[item.id] ?? 0;

        div.innerHTML = `
            <div class="food-scroll">
                <span class="food-name">${item.nombre} — <b>${item.porcion}</b></span>
            </div>

            <input 
                type="number"
                min="0"
                max="100"
                step="0.5"
                class="portion-input"
                value="${currentValue}"
                data-food-id="${item.id}">
        `;

        div.querySelector("input").addEventListener("input", updateSelection);

        tabContent.appendChild(div);
    });
}

// =======================================================
// GUARDAR SELECCIÓN
// =======================================================

function updateSelection(e) {
    const id = e.target.dataset.foodId;
    const value = parseFloat(e.target.value) || 0;
    userSelections[id] = value;
}

// =======================================================
// CÁLCULOS NUTRICIONALES
// =======================================================

function calcularTotalesDieta() {
    const totalesGrupos = {};
    let totalGeneral = { kcal: 0, prot: 0, cho: 0, lip: 0 };

    for (const grupo in grupoNutrientesBase) {
        totalesGrupos[grupo] = { porciones: 0, kcal: 0, prot: 0, cho: 0, lip: 0 };

        if (allFoods[grupo]) {
            allFoods[grupo].forEach(item => {
                const porciones = userSelections[item.id] || 0;
                totalesGrupos[grupo].porciones += porciones;
            });
        }
    }

    for (const grupo in totalesGrupos) {
        const p = totalesGrupos[grupo].porciones;
        const b = grupoNutrientesBase[grupo];

        if (p > 0) {
            totalesGrupos[grupo].kcal = p * b.kcal;
            totalesGrupos[grupo].prot = p * b.prot;
            totalesGrupos[grupo].cho  = p * b.cho;
            totalesGrupos[grupo].lip  = p * b.lip;

            totalGeneral.kcal += p * b.kcal;
            totalGeneral.prot += p * b.prot;
            totalGeneral.cho  += p * b.cho;
            totalGeneral.lip  += p * b.lip;
        }
    }

    return { grupos: totalesGrupos, total: totalGeneral };
}

function calcularAdecuacion(total, req) {
    const a = {};
    ["kcal","prot","cho","lip"].forEach(n => {
        a[n] = req[n] > 0 ? (total[n] / req[n]) * 100 : 0;
    });
    return a;
}

function updateRequerimientosAndSummary(e) {
    const nutriente = e.target.dataset.nutriente;
    const value = Math.max(0, parseFloat(e.target.value) || 0);
    requerimientos[nutriente] = value;
    renderSummary();
}

// =======================================================
// RESUMEN FINAL
// =======================================================

function renderSummary() {
    const totalesDieta = calcularTotalesDieta();
    const adecuacion = calcularAdecuacion(totalesDieta.total, requerimientos);

    let tableHTML = `
        <div class="summary-container">
            <h2>Resumen Nutricional y Adecuación</h2>
            <p>Datos calculados en base a ${totalesDieta.total.kcal.toFixed(0)} Kcal totales.</p>

            <table id="calculadora-table">
                <thead>
                    <tr>
                        <th>GRUPO</th>
                        <th>PORCIONES</th>
                        <th>KCAL</th>
                        <th>PROT</th>
                        <th>CHO</th>
                        <th>LÍPIDOS</th>
                    </tr>
                </thead>
                <tbody>
    `;

    for (const g in totalesDieta.grupos) {
        const d = totalesDieta.grupos[g];
        tableHTML += `
            <tr>
                <td><b>${formatGroupName(g)}</b></td>
                <td>${d.porciones.toFixed(1)}</td>
                <td>${d.kcal.toFixed(0)}</td>
                <td>${d.prot.toFixed(1)}</td>
                <td>${d.cho.toFixed(1)}</td>
                <td>${d.lip.toFixed(1)}</td>
            </tr>
        `;
    }

    tableHTML += `
        <tr class="total-row">
            <td><b>TOTAL</b></td>
            <td></td>
            <td>${totalesDieta.total.kcal.toFixed(0)}</td>
            <td>${totalesDieta.total.prot.toFixed(1)}</td>
            <td>${totalesDieta.total.cho.toFixed(1)}</td>
            <td>${totalesDieta.total.lip.toFixed(1)}</td>
        </tr>

        <tr class="requerimiento-row">
            <td><b>REQUERIMIENTO</b></td>
            <td></td>
            <td><input type="number" data-nutriente="kcal" value="${requerimientos.kcal}"></td>
            <td><input type="number" data-nutriente="prot" value="${requerimientos.prot}"></td>
            <td><input type="number" data-nutriente="cho" value="${requerimientos.cho}"></td>
            <td><input type="number" data-nutriente="lip" value="${requerimientos.lip}"></td>
        </tr>

        <tr>
            <td><b>ADECUACIÓN</b></td>
            <td></td>
            <td>${adecuacion.kcal.toFixed(1)}%</td>
            <td>${adecuacion.prot.toFixed(1)}%</td>
            <td>${adecuacion.cho.toFixed(1)}%</td>
            <td>${adecuacion.lip.toFixed(1)}%</td>
        </tr>
    `;

    tableHTML += `</tbody></table></div>`;

    tabContent.innerHTML = tableHTML;

    document.querySelectorAll(".requerimiento-row input").forEach(input => {
        input.addEventListener("input", updateRequerimientosAndSummary);
    });
}

// =======================================================
// UTILIDADES
// =======================================================

function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatGroupName(groupKey) {
    const names = {
        cereales: "Cereales y Papas",
        verduras: "Verduras",
        frutas: "Frutas",
        lacteos: "Lácteos",
        carnes: "Carnes",
        leguminosas: "Leguminosas",
        lipidos: "Ricos en Lípidos",
        aceites: "Aceites",
        azucares: "Azúcares"
    };
    return names[groupKey] || capitalize(groupKey);
}

// =======================================================
// INICIO
// =======================================================

(async function init() {
    allFoods = await loadFoods();

    if (Object.keys(allFoods).length === 0) {
        tabContent.innerHTML = "<p>Error: No se pudo cargar la base de datos.</p>";
        return;
    }

    loadFoodFamily(allFoods, "cereales");
})();

// =======================================================
// DARK MODE — BOTÓN FLOTANTE
// =======================================================

(function darkModeInit() {
    const body = document.body;

    const toggleBtn = document.createElement("button");
    toggleBtn.classList.add("darkmode-toggle");
    toggleBtn.innerHTML = "🌙";
    document.body.appendChild(toggleBtn);

    const saved = localStorage.getItem("theme");

    if (saved === "dark") {
        body.classList.add("manual-dark");
        toggleBtn.innerHTML = "☀️";
    } else if (saved === "light") {
        body.classList.add("manual-light");
        toggleBtn.innerHTML = "🌙";
    }

    toggleBtn.addEventListener("click", () => {
        if (body.classList.contains("manual-dark")) {
            body.classList.remove("manual-dark");
            body.classList.add("manual-light");
            toggleBtn.innerHTML = "🌙";
            localStorage.setItem("theme", "light");
        }
        else if (body.classList.contains("manual-light")) {
            body.classList.remove("manual-light");
            body.classList.add("manual-dark");
            toggleBtn.innerHTML = "☀️";
            localStorage.setItem("theme", "dark");
        }
        else {
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            if (prefersDark) {
                body.classList.add("manual-light");
                toggleBtn.innerHTML = "🌙";
                localStorage.setItem("theme", "light");
            } else {
                body.classList.add("manual-dark");
                toggleBtn.innerHTML = "☀️";
                localStorage.setItem("theme", "dark");
            }
        }
    });
})();

// =======================================================
// FLECHAS PARA SCROLL DE TABS
// =======================================================

(function initTabArrows() {
    const tabs = document.querySelector(".tabs");

    // Flecha izquierda
    const leftBtn = document.createElement("button");
    leftBtn.classList.add("tab-arrow", "tab-arrow-left");
    leftBtn.innerHTML = "◀";

    // Flecha derecha
    const rightBtn = document.createElement("button");
    rightBtn.classList.add("tab-arrow", "tab-arrow-right");
    rightBtn.innerHTML = "▶";

    // Insertar
    tabs.parentElement.insertBefore(leftBtn, tabs);
    tabs.parentElement.appendChild(rightBtn);

    // Scroll suave
    leftBtn.addEventListener("click", () => {
        tabs.scrollBy({ left: -200, behavior: "smooth" });
    });

    rightBtn.addEventListener("click", () => {
        tabs.scrollBy({ left: 200, behavior: "smooth" });
    });
})();
