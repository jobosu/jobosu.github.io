/* =========================================================
   JOBOSU // LAB
   EXP 002 — TECHNOLOGY LANDSCAPE
   Graph Engine v0.3

   The graph engine is intentionally independent from
   the dataset. Data will live in /data/ecosystem.json.
========================================================= */

"use strict";


/* =========================================================
   APPLICATION STATE
========================================================= */

const state = {
  nodes: [],
  links: [],

  selected: null,
  activeFilter: "all",

  scale: 1,
  offsetX: 0,
  offsetY: 0,

  dragging: false,
  movedDuringDrag: false,

  lastX: 0,
  lastY: 0
};


/* =========================================================
   DOM REFERENCES
========================================================= */

const svg = document.getElementById("graph");
const world = document.getElementById("world");
const panelContent = document.getElementById("panelContent");

const SVG_NS = "http://www.w3.org/2000/svg";


/* =========================================================
   DATA
========================================================= */

async function loadData() {

  try {

    const response = await fetch("./data/ecosystem.json");

    if (!response.ok) {
      throw new Error(
        `Dataset request failed: ${response.status}`
      );
    }

    const data = await response.json();

    state.nodes = data.nodes || [];
    state.links = data.links || [];

    buildGraph();
    centerGraph();
    updateSystemPanel(data);

  }

  catch (error) {

    console.error(
      "JOBOSU EXP 002 — Dataset error:",
      error
    );

    panelContent.innerHTML = `
      <div class="panel-id">ERROR</div>

      <h2>Dataset unavailable</h2>

      <div class="panel-type">
        SYSTEM / DATA
      </div>

      <div class="field">
        <div class="field-name">
          STATUS
        </div>

        <div class="field-value">
          ecosystem.json could not be loaded.
        </div>
      </div>
    `;

  }

}


/* =========================================================
   HELPERS
========================================================= */

function nodeById(id) {

  return state.nodes.find(
    node => node.id === id
  );

}


function linksForNode(id) {

  return state.links.filter(
    link =>
      link.source === id ||
      link.target === id
  );

}


function connectedNodeIds(id) {

  const connected = new Set([id]);

  linksForNode(id).forEach(link => {

    if (link.source === id) {
      connected.add(link.target);
    }

    if (link.target === id) {
      connected.add(link.source);
    }

  });

  return connected;

}


function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* =========================================================
   GRAPH CONSTRUCTION
========================================================= */

function buildGraph() {

  clearGraph();

  buildLinks();
  buildNodes();

}


function clearGraph() {

  world
    .querySelectorAll(
      ".link, .node"
    )
    .forEach(element => element.remove());

}


/* =========================================================
   LINKS
========================================================= */

function buildLinks() {

  state.links.forEach(link => {

    const source =
      nodeById(link.source);

    const target =
      nodeById(link.target);

    if (!source || !target) {
      return;
    }

    const line =
      document.createElementNS(
        SVG_NS,
        "line"
      );

    line.setAttribute(
      "x1",
      source.x
    );

    line.setAttribute(
      "y1",
      source.y
    );

    line.setAttribute(
      "x2",
      target.x
    );

    line.setAttribute(
      "y2",
      target.y
    );

    line.classList.add("link");

    line.dataset.source =
      source.id;

    line.dataset.target =
      target.id;

    line.dataset.type =
      link.type || "connection";

    world.appendChild(line);

  });

}


/* =========================================================
   NODES
========================================================= */

function buildNodes() {

  state.nodes.forEach(node => {

    const group =
      document.createElementNS(
        SVG_NS,
        "g"
      );

    group.classList.add(
      "node",
      `category-${node.category}`
    );

    group.dataset.id =
      node.id;

    group.dataset.category =
      node.category;

    group.dataset.type =
      node.type;

    group.setAttribute(
      "transform",
      `translate(${node.x}, ${node.y})`
    );


    /* NODE CIRCLE */

    const circle =
      document.createElementNS(
        SVG_NS,
        "circle"
      );

    circle.setAttribute(
      "r",
      node.radius || 28
    );

    circle.classList.add(
      "node-circle"
    );


    /* CORE */

    const core =
      document.createElementNS(
        SVG_NS,
        "circle"
      );

    core.setAttribute(
      "r",
      node.type === "system"
        ? 3
        : 2.2
    );

    core.classList.add(
      "node-core"
    );


    /* LABEL */

    const label =
      document.createElementNS(
        SVG_NS,
        "text"
      );

    label.setAttribute(
      "y",
      (node.radius || 28) + 17
    );

    label.classList.add(
      "node-label"
    );

    label.textContent =
      node.name;


    /* ASSEMBLE */

    group.appendChild(circle);
    group.appendChild(core);
    group.appendChild(label);


    /* INTERACTION */

    group.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        if (state.movedDuringDrag) {
          return;
        }

        selectNode(node.id);

      }
    );


    world.appendChild(group);

  });

}


/* =========================================================
   NODE SELECTION
========================================================= */

function selectNode(id) {

  const node =
    nodeById(id);

  if (!node) {
    return;
  }

  state.selected = id;

  const connected =
    connectedNodeIds(id);


  document
    .querySelectorAll(".node")
    .forEach(element => {

      element.classList.remove(
        "selected",
        "dim"
      );

      if (
        element.dataset.id === id
      ) {

        element.classList.add(
          "selected"
        );

      }

      else if (
        !connected.has(
          element.dataset.id
        )
      ) {

        element.classList.add(
          "dim"
        );

      }

    });


  document
    .querySelectorAll(".link")
    .forEach(element => {

      element.classList.remove(
        "active",
        "dim"
      );

      if (
        element.dataset.source === id ||
        element.dataset.target === id
      ) {

        element.classList.add(
          "active"
        );

      }

      else {

        element.classList.add(
          "dim"
        );

      }

    });


  updateNodePanel(
    node,
    connected
  );

}


/* =========================================================
   CLEAR SELECTION
========================================================= */

function clearSelection() {

  state.selected = null;


  document
    .querySelectorAll(".node")
    .forEach(element => {

      element.classList.remove(
        "selected",
        "dim"
      );

    });


  document
    .querySelectorAll(".link")
    .forEach(element => {

      element.classList.remove(
        "active",
        "dim"
      );

    });


  applyFilter(
    state.activeFilter
  );

}


/* =========================================================
   INFORMATION PANEL
========================================================= */

function updateSystemPanel(data) {

  const nodeCount =
    state.nodes.length;

  const linkCount =
    state.links.length;

  panelContent.innerHTML = `

    <div class="panel-id">
      SYSTEM
    </div>

    <h2>
      Technology Landscape
    </h2>

    <div class="panel-type">
      GLOBAL VIEW
    </div>

    <div class="field">

      <div class="field-name">
        STATUS
      </div>

      <div class="field-value">
        Select a node to inspect the system.
      </div>

    </div>

    <div class="field">

      <div class="field-name">
        ENTITIES
      </div>

      <div class="field-value">
        ${nodeCount}
      </div>

    </div>

    <div class="field">

      <div class="field-name">
        CONNECTIONS
      </div>

      <div class="field-value">
        ${linkCount}
      </div>

    </div>

    <div class="field">

      <div class="field-name">
        DATASET
      </div>

      <div class="field-value">
        ${escapeHTML(data.version || "prototype")}
      </div>

    </div>

    <div class="field">

      <div class="field-name">
        UPDATED
      </div>

      <div class="field-value">
        ${escapeHTML(data.updated || "—")}
      </div>

    </div>

  `;

}


function updateNodePanel(
  node,
  connected
) {

  const connectionNames =
    [...connected]

      .filter(
        id => id !== node.id
      )

      .map(
        id => nodeById(id)
      )

      .filter(Boolean);


  const domains =
    Array.isArray(node.domains)
      ? node.domains
      : [];


  panelContent.innerHTML = `

    <div class="panel-id">
      ${escapeHTML(
        node.id.toUpperCase()
      )}
    </div>

    <h2>
      ${escapeHTML(node.name)}
    </h2>

    <div class="panel-type">
      ${escapeHTML(
        String(node.type).toUpperCase()
      )}
      /
      ${escapeHTML(
        String(node.category).toUpperCase()
      )}
    </div>


    <div class="field">

      <div class="field-name">
        ROLE
      </div>

      <div class="field-value">
        ${escapeHTML(
          node.description || "—"
        )}
      </div>

    </div>


    ${
      node.country
      ? `

        <div class="field">

          <div class="field-name">
            COUNTRY / REGION
          </div>

          <div class="field-value">
            ${escapeHTML(node.country)}
          </div>

        </div>

      `
      : ""
    }


    ${
      node.ticker
      ? `

        <div class="field">

          <div class="field-name">
            MARKET
          </div>

          <div class="field-value">
            ${escapeHTML(node.ticker)}
          </div>

        </div>

      `
      : ""
    }


    ${
      domains.length
      ? `

        <div class="field">

          <div class="field-name">
            DOMAINS
          </div>

          <div class="connections-list">

            ${domains
              .map(
                domain => `
                  <span class="connection-tag">
                    ${escapeHTML(domain)}
                  </span>
                `
              )
              .join("")
            }

          </div>

        </div>

      `
      : ""
    }


    <div class="field">

      <div class="field-name">
        CONNECTIONS
      </div>

      <div class="connections-list">

        ${
          connectionNames.length

          ? connectionNames
              .map(
                connectedNode => `
                  <span
                    class="connection-tag"
                    data-open-node="${escapeHTML(
                      connectedNode.id
                    )}"
                  >
                    ${escapeHTML(
                      connectedNode.name
                    )}
                  </span>
                `
              )
              .join("")

          : `
              <span class="field-value">
                —
              </span>
            `
        }

      </div>

    </div>


    <div class="field">

      <div class="field-name">
        DATA STATUS
      </div>

      <div class="field-value">
        ${escapeHTML(
          node.dataStatus ||
          "STRUCTURAL PROTOTYPE"
        )}
      </div>

    </div>

  `;


  panelContent
    .querySelectorAll(
      "[data-open-node]"
    )
    .forEach(element => {

      element.style.cursor =
        "pointer";

      element.addEventListener(
        "click",
        () => {

          selectNode(
            element.dataset.openNode
          );

        }
      );

    });

}


/* =========================================================
   FILTERS
========================================================= */

document
  .querySelectorAll(".filter")
  .forEach(filter => {

    filter.addEventListener(
      "click",
      () => {

        const category =
          filter.dataset.filter;

        state.activeFilter =
          category;


        document
          .querySelectorAll(".filter")
          .forEach(element => {

            element.classList.remove(
              "active"
            );

          });


        filter.classList.add(
          "active"
        );


        state.selected = null;

        applyFilter(category);

      }
    );

  });


function applyFilter(category) {

  document
    .querySelectorAll(".node")
    .forEach(element => {

      element.classList.remove(
        "hidden",
        "selected",
        "dim"
      );

      if (
        category !== "all" &&
        element.dataset.category !== category
      ) {

        element.classList.add(
          "hidden"
        );

      }

    });


  document
    .querySelectorAll(".link")
    .forEach(element => {

      element.classList.remove(
        "active",
        "dim"
      );

      if (category === "all") {

        element.style.display =
          "";

        return;

      }


      const source =
        nodeById(
          element.dataset.source
        );

      const target =
        nodeById(
          element.dataset.target
        );


      if (
        source &&
        target &&
        source.category === category &&
        target.category === category
      ) {

        element.style.display =
          "";

      }

      else {

        element.style.display =
          "none";

      }

    });

}


/* =========================================================
   PAN
========================================================= */

svg.addEventListener(
  "pointerdown",
  event => {

    state.dragging = true;
    state.movedDuringDrag = false;

    state.lastX =
      event.clientX;

    state.lastY =
      event.clientY;

    svg.classList.add(
      "dragging"
    );

    svg.setPointerCapture(
      event.pointerId
    );

  }
);


svg.addEventListener(
  "pointermove",
  event => {

    if (!state.dragging) {
      return;
    }


    const dx =
      event.clientX -
      state.lastX;

    const dy =
      event.clientY -
      state.lastY;


    if (
      Math.abs(dx) > 1 ||
      Math.abs(dy) > 1
    ) {

      state.movedDuringDrag =
        true;

    }


    state.offsetX += dx;
    state.offsetY += dy;

    state.lastX =
      event.clientX;

    state.lastY =
      event.clientY;

    renderTransform();

  }
);


svg.addEventListener(
  "pointerup",
  event => {

    state.dragging = false;

    svg.classList.remove(
      "dragging"
    );

    if (
      svg.hasPointerCapture(
        event.pointerId
      )
    ) {

      svg.releasePointerCapture(
        event.pointerId
      );

    }

  }
);


/* =========================================================
   ZOOM
========================================================= */

svg.addEventListener(
  "wheel",
  event => {

    event.preventDefault();


    const rect =
      svg.getBoundingClientRect();

    const mouseX =
      event.clientX -
      rect.left;

    const mouseY =
      event.clientY -
      rect.top;


    const worldX =
      (
        mouseX -
        state.offsetX
      ) /
      state.scale;

    const worldY =
      (
        mouseY -
        state.offsetY
      ) /
      state.scale;


    const factor =
      event.deltaY > 0
        ? 0.9
        : 1.1;


    const newScale =
      Math.min(
        2.8,
        Math.max(
          0.5,
          state.scale * factor
        )
      );


    state.offsetX =
      mouseX -
      worldX *
      newScale;

    state.offsetY =
      mouseY -
      worldY *
      newScale;

    state.scale =
      newScale;


    renderTransform();

  },
  {
    passive: false
  }
);


/* =========================================================
   TRANSFORM
========================================================= */

function renderTransform() {

  world.setAttribute(
    "transform",
    `
      translate(
        ${state.offsetX}
        ${state.offsetY}
      )
      scale(${state.scale})
    `
  );

}


/* =========================================================
   INITIAL GRAPH POSITION
========================================================= */

function centerGraph() {

  if (!state.nodes.length) {
    return;
  }


  const rect =
    svg.getBoundingClientRect();


  const xs =
    state.nodes.map(
      node => node.x
    );

  const ys =
    state.nodes.map(
      node => node.y
    );


  const minX =
    Math.min(...xs);

  const maxX =
    Math.max(...xs);

  const minY =
    Math.min(...ys);

  const maxY =
    Math.max(...ys);


  const graphWidth =
    maxX - minX;

  const graphHeight =
    maxY - minY;


  /*
    Less empty space than v0.2.
    The graph intentionally occupies more of the viewport.
  */

  const horizontalPadding = 120;
  const verticalPadding = 120;


  const availableWidth =
    Math.max(
      100,
      rect.width -
      horizontalPadding
    );

  const availableHeight =
    Math.max(
      100,
      rect.height -
      verticalPadding
    );


  state.scale =
    Math.min(
      availableWidth /
        graphWidth,

      availableHeight /
        graphHeight
    );


  state.scale *= 0.92;


  state.scale =
    Math.min(
      1.35,
      Math.max(
        0.55,
        state.scale
      )
    );


  const centerX =
    (minX + maxX) / 2;

  const centerY =
    (minY + maxY) / 2;


  state.offsetX =
    rect.width / 2 -
    centerX *
    state.scale;


  state.offsetY =
    rect.height / 2 -
    centerY *
    state.scale +
    15;


  renderTransform();

}


/* =========================================================
   BACKGROUND CLICK
========================================================= */

svg.addEventListener(
  "click",
  event => {

    if (
      event.target === svg ||
      event.target === world
    ) {

      clearSelection();

    }

  }
);


/* =========================================================
   RESIZE
========================================================= */

let resizeTimer;

window.addEventListener(
  "resize",
  () => {

    clearTimeout(
      resizeTimer
    );

    resizeTimer =
      setTimeout(
        centerGraph,
        120
      );

  }
);


/* =========================================================
   BOOT
========================================================= */

loadData();
