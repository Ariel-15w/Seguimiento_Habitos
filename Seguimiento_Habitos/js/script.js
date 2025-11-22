/* =========================================
   EL CEREBRO DE TU BULLET JOURNAL 🧠
   ========================================= */

// Esperamos a que el HTML cargue completo antes de trabajar
document.addEventListener('DOMContentLoaded', () => {
    iniciarApp();
});

function iniciarApp() {
    console.log("App iniciada correctamente 🚀");
    
    // 1. Generar los 31 días del Diario
    generarDiario();

    // 2. Generar las 31 filas del Tracker de Hábitos
    generarTracker();

    // Asegurar que cada columna tenga su botón de eliminar (si falta)
    ensureRemoveButtons();

    // 3. Cargar datos guardados (si existen)
    cargarDatos();

    // 4. Activar la lógica de la Gráfica
    actualizarGrafica();

    // 5. Activar botones y eventos
    configurarEventos();

    // AGREGA ESTA LÍNEA: inicializar la lógica del modal (Cambiar Mes)
    configurarModal(); 
}

/* =========================================
   1. GENERADOR DEL DIARIO (1 al 31)
   ========================================= */
function generarDiario() {
    const contenedor = document.getElementById('lista-diario');
    // Limpiamos el ejemplo que pusimos en HTML
    contenedor.innerHTML = '';

    // Bucle: Repetir 31 veces
    for (let dia = 1; dia <= 31; dia++) {
        const renglon = document.createElement('div');
        renglon.className = 'renglon-diario';
        
        renglon.innerHTML = `
            <span class="numero-dia">${dia}</span>
            <div class="entrada-texto" contenteditable="true" 
                 id="diario-dia-${dia}" 
                 placeholder="Escribe aquí..."></div>
        `;
        contenedor.appendChild(renglon);
    }
}

/* =========================================
   2. GENERADOR DEL TRACKER (31 FILAS)
   ========================================= */
function generarTracker() {
    const grid = document.getElementById('grid-habitos');
    
    // TRUCO: Guardamos el encabezado (Títulos) antes de borrar todo
    // porque ese ya lo escribiste en el HTML y no queremos perderlo.
    const encabezado = grid.querySelector('.fila-encabezados');
    
    // Limpiamos todo
    grid.innerHTML = '';
    // Volvemos a poner el encabezado
    grid.appendChild(encabezado);

    // Número de columnas a generar según encabezado (permite añadir dinámicamente)
    const numColumnas = encabezado.querySelectorAll('.columna-habito').length || 5;

    // Ajustar template-columns del grid (en filas individuales) para que se adapte al número de hábitos
    const template = `40px repeat(${numColumnas}, 1fr)`;
    encabezado.style.gridTemplateColumns = template;

    // Generamos las 31 filas de checkboxes
    for (let dia = 1; dia <= 31; dia++) {
        const fila = document.createElement('div');
        fila.className = 'fila-dia';
        
        // Creamos N checkboxes por día (uno por cada hábito detectado en el encabezado)
        let checkboxesHTML = '';
        for (let habito = 0; habito < numColumnas; habito++) {
            checkboxesHTML += `<input type="checkbox" class="check-habito" data-dia="${dia}" data-columna="${habito}">`;
        }
        fila.innerHTML = `
            <span class="dia-label">${dia}</span>
            ${checkboxesHTML}
        `;
        // Asegurar que la fila use el mismo template-columns que el encabezado
        fila.style.gridTemplateColumns = template;
        grid.appendChild(fila);
    }

        // Ajustar altura de la gráfica para que coincida con la nueva altura del grid
        syncGraphHeight();
}

/* =========================================
   3. LÓGICA DE LA GRÁFICA (MATEMÁTICAS) 📈
   ========================================= */
function actualizarGrafica() {
    const svg = document.getElementById('grafica-progreso');
    const filas = document.querySelectorAll('.fila-dia'); // Las 31 filas
    let puntos = "";
    
    const anchoTotal = 100; // Usamos porcentaje
    const altoFila = 100 / 31; // Altura de cada día en %

    filas.forEach((fila, index) => {
        // Contamos cuántos checks están marcados en este día
        const checks = fila.querySelectorAll('input[type="checkbox"]:checked');
        const cantidadMarcados = checks.length;
        const totalHabitos = fila.querySelectorAll('input[type="checkbox"]').length || 5; // dinámico

        // MATEMÁTICAS:
        // Eje X (Horizontal): Si marco 5, voy al 100%. Si marco 0, voy al 0%.
        const x = (cantidadMarcados / totalHabitos) * anchoTotal;
        
        // Eje Y (Vertical): El centro de la fila del día correspondiente
        const y = (index * altoFila) + (altoFila / 2);

        // Agregamos la coordenada a la lista de puntos
        puntos += `${x},${y} `;
    });

    // Dibujamos la línea en el SVG
    svg.innerHTML = `
        <polyline points="${puntos}" 
                  fill="none" 
                  stroke="#4F46E5" 
                  stroke-width="2"
                  vector-effect="non-scaling-stroke" />
    `;

        // Re-sincronizar altura por si el contenido cambió
        syncGraphHeight();
}

/* =========================================
   4. GESTIÓN DE OBJETIVOS
   ========================================= */
function agregarObjetivo() {
    const input = document.getElementById('input-objetivo');
    const lista = document.getElementById('lista-objetivos');
    const texto = input.value.trim();

    if (texto !== "") {
        const nuevoLi = document.createElement('li');
        nuevoLi.textContent = texto;
        nuevoLi.contentEditable = true; // Para poder editarlo después
        lista.appendChild(nuevoLi);
        
        input.value = ""; // Limpiar el campo
        guardarDatos(); // Guardar cambios
    }
}

/* =========================================
   5. REFLEXIONES Y MODO EDICIÓN
   ========================================= */
function toggleModoEdicion() {
    const btn = document.getElementById('btn-modo-edicion');
    const controles = document.querySelectorAll('.control-edicion');
    const esModoEdicion = btn.innerText === "LISTO"; // ¿Estamos editando?

    if (esModoEdicion) {
        // SALIR DEL MODO EDICIÓN (OCULTAR)
        btn.innerText = "EDITAR";
        btn.style.background = "var(--bg-body)";
        btn.style.color = "var(--text-muted)";
        
        // Ocultamos todo de nuevo
        controles.forEach(el => el.style.display = 'none');
        
    } else {
        // ENTRAR AL MODO EDICIÓN (MOSTRAR)
        btn.innerText = "LISTO";
        btn.style.background = "var(--primary)";
        btn.style.color = "white";
        
        // Mostramos los controles
        controles.forEach(el => {
            // Si es el botón de eliminar, usamos 'flex' para que el icono se centre
            if(el.classList.contains('btn-eliminar')) {
                el.style.display = 'flex';
            } else {
                el.style.display = 'block';
            }
        });
    }
}

function eliminarSlider(boton) {
    if(confirm("¿Borrar esta categoría?")) {
        boton.closest('.slider-contenedor').remove();
        guardarDatos();
    }
}

function agregarNuevoSlider() {
    const contenedorPadre = document.getElementById('lista-reflexiones');
    
    const nuevoHTML = `
    <div class="slider-contenedor">
        <div class="info-top">
            <button class="btn-eliminar control-edicion" onclick="eliminarSlider(this)" style="display:block">
                <span class="material-icons-round">remove_circle</span>
            </button>
            <label class="nombre-categoria" contenteditable="true">Nueva Categoría</label>
            <span class="valor-numero">5</span>
        </div>
        <input type="range" min="0" max="10" value="5" oninput="actualizarNumeroSlider(this)">
    </div>
    `;
    // Insertamos el HTML al final
    contenedorPadre.insertAdjacentHTML('beforeend', nuevoHTML);
}

function actualizarNumeroSlider(input) {
    // Busca el span hermano anterior (el número) y actualiza su texto
    const spanNumero = input.parentElement.querySelector('.valor-numero');
    spanNumero.textContent = input.value;
    guardarDatos();
}

/* =========================================
   6. GUARDADO AUTOMÁTICO (LOCALSTORAGE) 💾
   ========================================= */
function configurarEventos() {
    // A. Escuchar cambios en checkboxes para actualizar gráfica
    document.getElementById('grid-habitos').addEventListener('change', (e) => {
        if(e.target.type === 'checkbox') {
            actualizarGrafica();
            guardarDatos();
        }
    });

    // B. Escuchar cambios en texto (Diario y Objetivos)
    document.body.addEventListener('input', (e) => {
        // Guardamos automáticamente cuando escriben
        guardarDatos(); 
    });

    // C. Botón de Objetivos
    document.getElementById('btn-agregar-objetivo').addEventListener('click', agregarObjetivo);
    // Permitir agregar con tecla ENTER en el input
    document.getElementById('input-objetivo').addEventListener('keypress', (e) => {
        if(e.key === 'Enter') agregarObjetivo();
    });

    // D. Reflexiones
    document.getElementById('btn-modo-edicion').addEventListener('click', toggleModoEdicion);
    document.getElementById('btn-agregar-reflexion').addEventListener('click', agregarNuevoSlider);
    
    // Escuchar cambios en sliders existentes
    const sliders = document.querySelectorAll('input[type="range"]');
    sliders.forEach(slider => {
        slider.addEventListener('input', function() {
            actualizarNumeroSlider(this);
        });
    });

    // Botones de eliminar existentes
    const botonesEliminar = document.querySelectorAll('.btn-eliminar');
    botonesEliminar.forEach(btn => {
        btn.addEventListener('click', function() { eliminarSlider(this) });
    });

    // E. Botón de Reinicio General
    const btnReset = document.getElementById('btn-reset');
    if (btnReset) {
        btnReset.addEventListener('click', reiniciarTodo);
    }

    // F. Editor de Hábitos (nuevo)
    const btnEditarHabitos = document.getElementById('btn-habitos-editar');
    const btnAgregarHabito = document.getElementById('btn-agregar-habito');
    if (btnEditarHabitos) btnEditarHabitos.addEventListener('click', toggleHabitsEditMode);
    if (btnAgregarHabito) btnAgregarHabito.addEventListener('click', () => addHabitColumn('Nuevo'));
}


/* =========================================
   8. LÓGICA DEL MODAL (CAMBIAR MES)
   ========================================= */
function configurarModal() {
    const modal = document.getElementById('modal-config');
    const btnAbrir = document.getElementById('btn-config-mes');
    const btnCancelar = document.getElementById('btn-cancelar-modal');
    const btnAplicar = document.getElementById('btn-aplicar-modal');
    
    const inputMes = document.getElementById('select-mes-modal');
    const inputAnio = document.getElementById('input-anio-modal');
    const tituloPrincipal = document.getElementById('titulo-mes');

    // 1. ABRIR MODAL
    if (btnAbrir) {
        btnAbrir.addEventListener('click', () => {
            // Pre-llenar con los datos actuales
            const textoActual = tituloPrincipal.innerText; // Ej: "DICIEMBRE 2025"
            const partes = textoActual.split(' '); // ["DICIEMBRE", "2025"]
            
            if(partes.length === 2) {
                inputMes.value = partes[0]; // Selecciona el mes en el dropdown
                inputAnio.value = partes[1]; // Pone el año
            }
            
            modal.classList.add('active'); // Muestra la ventana
        });
    }

    // 2. CERRAR (CANCELAR)
    if (btnCancelar) btnCancelar.addEventListener('click', () => modal.classList.remove('active'));

    // 3. APLICAR CAMBIOS
    if (btnAplicar) {
        btnAplicar.addEventListener('click', () => {
            const nuevoMes = inputMes.value;
            const nuevoAnio = inputAnio.value;
            
            // Actualizamos el H1
            tituloPrincipal.innerText = `${nuevoMes} ${nuevoAnio}`;
            
            // Guardamos y cerramos
            guardarDatos();
            modal.classList.remove('active');
        });
    }

    // Cerrar si haces clic fuera de la cajita blanca
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }
}

/* =========================================
   FUNCIONALIDAD: REINICIAR TODO (RESET)
   ========================================= */
function reiniciarTodo() {
    const confirmar = confirm("¿Borrar TODO y reiniciar el mes? Esta acción no se puede deshacer.");
    if (!confirmar) return;

    // Eliminamos los datos guardados y recargamos la página para volver al estado inicial
    localStorage.removeItem('miBulletJournal_v1');
    location.reload();
}

function guardarDatos() {
    // Objeto gigante donde guardamos TODO el estado de la app
    const datos = {
        mes: document.querySelector('.titulo-mes').innerText,
        mantra: document.querySelector('.mantra').innerText,
        
        // Guardamos el HTML del diario para no perder lo escrito
        diarioHTML: document.getElementById('lista-diario').innerHTML,
        
        // Guardamos estado de checkboxes (Array de true/false)
        habitos: [],
        nombresHabitos: [], // Guardamos los títulos de columnas editados
        
        objetivosHTML: document.getElementById('lista-objetivos').innerHTML,
        reflexionesHTML: document.getElementById('lista-reflexiones').innerHTML
    };

    // Guardar estado de cada checkbox
    const checks = document.querySelectorAll('.check-habito');
    checks.forEach(check => {
        datos.habitos.push(check.checked);
    });

    // Guardar nombres de hábitos
    const titulos = document.querySelectorAll('.columna-habito');
    titulos.forEach(t => {
        // Clonar y quitar botón de eliminar (si existe) para obtener solo el texto limpio
        const clone = t.cloneNode(true);
        const btnRemove = clone.querySelector('.btn-remove-habit');
        if (btnRemove) btnRemove.remove();
        datos.nombresHabitos.push(clone.innerText.trim());
    });

    // Guardar en el navegador
    localStorage.setItem('miBulletJournal_v1', JSON.stringify(datos));
}

function cargarDatos() {
    const datosGuardados = localStorage.getItem('miBulletJournal_v1');
    if (!datosGuardados) return; // Si es la primera vez, no hacemos nada

    const datos = JSON.parse(datosGuardados);

    // Restaurar Textos
    if(datos.mes) document.querySelector('.titulo-mes').innerText = datos.mes;
    if(datos.mantra) document.querySelector('.mantra').innerText = datos.mantra;
    
    // Restaurar Diario
    if(datos.diarioHTML) document.getElementById('lista-diario').innerHTML = datos.diarioHTML;

    // Restaurar Objetivos
    if(datos.objetivosHTML) document.getElementById('lista-objetivos').innerHTML = datos.objetivosHTML;

    // Restaurar Reflexiones (Sliders)
    if(datos.reflexionesHTML) {
        document.getElementById('lista-reflexiones').innerHTML = datos.reflexionesHTML;
        // Hay que reactivar los eventos de los sliders restaurados
        const sliders = document.querySelectorAll('input[type="range"]');
        sliders.forEach(slider => {
            slider.addEventListener('input', function() { actualizarNumeroSlider(this); });
        });
        const btns = document.querySelectorAll('.btn-eliminar');
        btns.forEach(btn => {
            btn.addEventListener('click', function() { eliminarSlider(this); });
        });
    }

    // Restaurar Nombres de Hábitos
    if(datos.nombresHabitos) {
        const grid = document.getElementById('grid-habitos');
        const encabezado = grid.querySelector('.fila-encabezados');

        // Si hay más nombres guardados que columnas actuales, añadimos columnas extra
        const actuales = encabezado.querySelectorAll('.columna-habito').length;
        if (datos.nombresHabitos.length > actuales) {
            for (let i = actuales; i < datos.nombresHabitos.length; i++) {
                addHabitColumn(datos.nombresHabitos[i]);
            }
        }

        // Ahora actualizamos los textos
        const titulos = encabezado.querySelectorAll('.columna-habito');
        titulos.forEach((t, index) => {
            if(datos.nombresHabitos[index]) {
                // Asignar el texto limpio (esto elimina nodos hijos), luego reañadir botón
                t.innerText = datos.nombresHabitos[index];
            }
        });
        // Asegurar botones de eliminar en todas las columnas
        ensureRemoveButtons();
    }

    // Restaurar Checkboxes
    if(datos.habitos) {
        const checks = document.querySelectorAll('.check-habito');
        checks.forEach((check, index) => {
            if(datos.habitos[index]) check.checked = true;
        });
    }

        // Asegurar que la gráfica tenga la misma altura después de cargar datos
        syncGraphHeight();
}

/* =========================================
   UTILIDADES: Añadir / Quitar columnas de hábito dinámicamente
   ========================================= */
function updateGridTemplateColumns() {
    const grid = document.getElementById('grid-habitos');
    const encabezado = grid.querySelector('.fila-encabezados');
    const num = encabezado.querySelectorAll('.columna-habito').length || 5;
    const template = `40px repeat(${num}, 1fr)`;
    // Aplicar tanto al encabezado como a cada fila
    encabezado.style.gridTemplateColumns = template;
    const filas = grid.querySelectorAll('.fila-dia');
    filas.forEach(f => f.style.gridTemplateColumns = template);
}

function reindexCheckboxes() {
    const filas = document.querySelectorAll('.fila-dia');
    filas.forEach(fila => {
        const checks = fila.querySelectorAll('input[type="checkbox"]');
        checks.forEach((c, idx) => c.setAttribute('data-columna', idx));
    });
}

function addHabitColumn(name = 'Nuevo') {
    const grid = document.getElementById('grid-habitos');
    const encabezado = grid.querySelector('.fila-encabezados');

    // Crear la celda de encabezado
    const div = document.createElement('div');
    div.className = 'columna-habito';
    div.contentEditable = true;
    div.innerText = name;

    // Botón eliminar (control-edicion)
    const btn = document.createElement('button');
    btn.className = 'btn-remove-habit control-edicion';
    btn.innerHTML = '<span class="material-icons-round">remove_circle</span>';
    btn.addEventListener('click', function() {
        // calcular índice dinámicamente
        const cols = Array.from(encabezado.querySelectorAll('.columna-habito'));
        const idx = cols.indexOf(this.parentElement);
        if (idx >= 0) removeHabitColumn(idx);
    });

    div.appendChild(btn);
    encabezado.appendChild(div);

    // Añadir checkbox por fila
    const filas = document.querySelectorAll('.fila-dia');
    filas.forEach((fila, di) => {
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.className = 'check-habito';
        input.setAttribute('data-dia', di + 1);
        // data-columna se asignará en reindex
        fila.appendChild(input);
    });

    updateGridTemplateColumns();
    reindexCheckboxes();
    guardarDatos();

        // La columna nueva cambia la altura/anchura visual; sincronizamos la gráfica
        syncGraphHeight();
}

function removeHabitColumn(index) {
    if (!confirm('¿Eliminar este hábito? Se eliminarán todas sus marcas.')) return;

    const grid = document.getElementById('grid-habitos');
    const encabezado = grid.querySelector('.fila-encabezados');
    const cols = encabezado.querySelectorAll('.columna-habito');
    if (index < 0 || index >= cols.length) return;

    // Remover header
    cols[index].remove();

    // Remover input correspondiente en cada fila
    const filas = document.querySelectorAll('.fila-dia');
    filas.forEach(fila => {
        const inputs = fila.querySelectorAll('input[type="checkbox"]');
        if (inputs[index]) inputs[index].remove();
    });

    updateGridTemplateColumns();
    reindexCheckboxes();
    guardarDatos();

        // Tras eliminar una columna, reajustar la gráfica
        syncGraphHeight();
}

function toggleHabitsEditMode() {
    const btn = document.getElementById('btn-habitos-editar');
    const cont = document.querySelector('.contenedor-tracker');
    const isEditing = cont.classList.contains('editing');
    const removeBtns = document.querySelectorAll('.btn-remove-habit');
    const agregar = document.getElementById('btn-agregar-habito');

    if (isEditing) {
        // salir
        cont.classList.remove('editing');
        btn.innerText = 'EDITAR';
        btn.style.background = 'var(--bg-body)';
        btn.style.color = 'var(--text-muted)';
        removeBtns.forEach(b => b.style.display = 'none');
        if (agregar) agregar.style.display = 'none';
        // desactivar la edición de títulos
        const cols = document.querySelectorAll('.columna-habito');
        cols.forEach(c => c.contentEditable = false);
    } else {
        // entrar
        cont.classList.add('editing');
        btn.innerText = 'LISTO';
        btn.style.background = 'var(--primary)';
        btn.style.color = 'white';
        removeBtns.forEach(b => b.style.display = 'inline-flex');
        if (agregar) agregar.style.display = 'block';
        const cols = document.querySelectorAll('.columna-habito');
        cols.forEach(c => c.contentEditable = true);
    }
}

function ensureRemoveButtons() {
    const grid = document.getElementById('grid-habitos');
    if (!grid) return;
    const encabezado = grid.querySelector('.fila-encabezados');
    if (!encabezado) return;
    const cols = encabezado.querySelectorAll('.columna-habito');
    cols.forEach(col => {
        if (!col.querySelector('.btn-remove-habit')) {
            const btn = document.createElement('button');
            btn.className = 'btn-remove-habit control-edicion';
            btn.innerHTML = '<span class="material-icons-round">remove_circle</span>';
            btn.addEventListener('click', function() {
                const colsArr = Array.from(encabezado.querySelectorAll('.columna-habito'));
                const idx = colsArr.indexOf(this.parentElement);
                if (idx >= 0) removeHabitColumn(idx);
            });
            // añadir al final del header cell
            col.appendChild(btn);
        }
    });
}

// Sincroniza la altura del SVG de la gráfica con la altura del grid de hábitos
function syncGraphHeight() {
    const grid = document.getElementById('grid-habitos');
    const svg = document.getElementById('grafica-progreso');
    const container = document.querySelector('.graph-container');
    if (!grid || !svg || !container) return;

    // Altura real del grid (incluye filas) — usar scrollHeight para incluir todo el contenido
    const gridHeight = grid.scrollHeight;

    // Aplicar la altura al SVG para que ocupe visualmente lo mismo
    svg.style.height = gridHeight + 'px';

    // Aseguramos un viewBox para que los puntos se calculen en escala 0..100
    // (el código de dibujo usa 0..100 en vertical y horizontal)
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');

    // Opcional: ajustar la altura del contenedor para evitar colapsos en algunos navegadores
    container.style.minHeight = gridHeight + 'px';
}

// Debounce util para evitar llamadas excesivas en resize
function debounce(fn, wait) {
    let t;
    return function(...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
    };
}

// Aseguramos que la gráfica se sincronice en puntos clave
// Llamadas: generarTracker, actualizarGrafica, cargarDatos, add/remove columnas, resize
window.addEventListener('resize', debounce(syncGraphHeight, 120));

// Integración: llamar a syncGraphHeight después de acciones que cambian tamaño
// Llamamos desde funciones existentes en sus puntos lógicos (al final de ellas). 
// Para backward-compatibility, hacemos llamadas directas en las funciones ya existentes
// mediante pequeñas inserciones: algunas llamadas ya se agregan en lugares donde
// actualizarGrafica() y generarTracker() se ejecutan.
