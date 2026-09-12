import React, { useState } from 'react';
import { AgentCoreLanguage } from './AgentCoreLanguage.jsx';
import { TopologyBlock } from './TopologyBlock.jsx';
import { Tex } from './Equation.jsx';
import { CHANNEL_ORDER, compileLabel } from './translation.js';
import visual from '../../encodings/visual.json';
import irMap from '../../encodings/ir-map.json';

const OBJECTS = [
  { name: 'Intent', meaning: 'Declared graph + policies + constraints + provenance.', owner: 'AODL document' },
  { name: 'Compiled plan', meaning: 'What this runtime can safely support.', owner: 'compiler profile (Hermes, Firstmate, …)' },
  { name: 'Observed', meaning: 'What is actually running.', owner: 'eventLog + observedGraph + receipts' },
];

const SYMBOLS = [
  { symbol: String.raw`V_t`, meaning: 'agents, models, tools, humans, memories, tasks, artifacts', json: 'intentGraph.nodes' },
  { symbol: String.raw`E_t`, meaning: 'typed relations: depend, data, message, delegate, verify, observe, …', json: 'intentGraph.edges' },
  { symbol: String.raw`S_t`, meaning: 'runtime state (lifecycle, events)', json: 'observedGraph + eventLog' },
  { symbol: String.raw`\Pi_t`, meaning: 'routing / execution / allocation policy', json: 'policies' },
  { symbol: String.raw`\Gamma_t`, meaning: 'goals, budgets, verification, human gates', json: 'constraints + humanGate' },
];

const REPO = 'https://github.com/kvnloo/aodl';

const READINGS = [
  { name: 'λ_A', maps: 'Intra-node calculus (oracle, bounded fix). Graph stays AODL.' },
  { name: 'Pact / Scribble / MPST', maps: '`message` is a session. Duality failure is ⊥.' },
  { name: 'AgentFlow ADG', maps: 'Recovers a graph from framework source. Audit, not authority.' },
  { name: 'STP sheaves', maps: 'Intent, plan, observed do not glue by assertion.' },
  { name: 'RLM', maps: 'Query slices of O_t. Do not dump the window.' },
  { name: 'AdaptOrch / Evo-Bench', maps: 'Search over compiled Π, not over schema versions.' },
  { name: 'Oversight inverted-U', maps: 'Human attention is a budget already legal under constraints.budgets.' },
];

const ADAPTERS = [
  { name: 'MCP', maps: 'Tools. Ports, not O_t.' },
  { name: 'A2A', maps: 'Peers. message / delegation.' },
  { name: 'AG-UI', maps: 'User surface. Visual τ / events.' },
  { name: 'LangGraph-class', maps: 'Compiler profile: existing HOTL 0.2 kinds. profiles/langchain.md. Not a harness id.' },
  { name: 'This network', maps: 'Hermes, Keel, Codex, Firstmate distro. Observed V, not competitors.' },
];

function SilhouetteCard({ id, topology, rec }) {
  const [exploded, setExploded] = useState(false);
  const kinds = rec.policies?.kinds;
  const toggle = () => setExploded((open) => !open);
  return (
    <article className="aodl-map__card" data-zoom={exploded ? 'pattern' : 'core'} data-topology={id}>
      <header>
        <button type="button" className="aodl-map__unit" aria-expanded={exploded} onClick={toggle}>
          <b>{topology.label}</b>
        </button>
        <span className="aodl-map__status" data-status={rec.status}>{rec.status}</span>
      </header>
      <TopologyBlock
        topologyId={id}
        providerId="multi"
        exploded={exploded}
        onToggle={toggle}
        label={`${topology.label} mapped ${rec.status}`}
      />
      <p>{rec.note || topology.description}</p>
      {kinds ? <code>policies.kinds: {kinds.join(', ')}</code> : null}
      {rec.requires ? <code>requires: {rec.requires.join(', ')}</code> : null}
      {rec.example ? <code>{rec.example}</code> : null}
    </article>
  );
}

export function Language() {
  const topologies = Object.entries(visual.topologies);
  const channels = CHANNEL_ORDER.map((id) => [id, irMap.channels[id]]);
  const fromHotl = Object.entries(irMap.fromHotl);
  const branch = import.meta.env.VITE_AODL_BRANCH;
  const sha = import.meta.env.VITE_AODL_SHA;
  const preview = branch && branch !== 'main';

  return (
    <div className="aodl-language">
      <header className="aodl-language__hero">
        <p className="aodl-language__kicker">Agent Orchestration Description Language · wire <code>hotl-0.2</code></p>
        <h1>AODL</h1>
        {preview ? (
          <p className="aodl-language__preview">
            Preview of <code>{branch}</code> <code>{sha}</code>
            {' · '}
            <a href="/aodl/">main</a>
            {' · '}
            <a href="/aodl/preview/">all branches</a>
          </p>
        ) : null}
        <p>
          A typed IR for agent graphs. Not a scheduler, not a payment system, and not a glowing core.
          The same language is below as mathematics and as React bound to <code>encodings/ir-map.json</code>.
        </p>
      </header>

      <section className="aodl-formal" aria-labelledby="aodl-object-title">
        <h2 id="aodl-object-title">Formal object</h2>
        <p>An orchestration at logical time <Tex math="t" /> is</p>
        <Tex display math={String.raw`\mathcal{O}_t = (V_t, E_t, S_t, \Pi_t, \Gamma_t)`} />
        <div className="aodl-table-wrap">
          <table className="aodl-table">
            <thead>
              <tr><th>Symbol</th><th>Meaning</th><th>JSON</th></tr>
            </thead>
            <tbody>
              {SYMBOLS.map((row) => (
                <tr key={row.json}>
                  <td><Tex math={row.symbol} /></td>
                  <td>{row.meaning}</td>
                  <td><code>{row.json}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="aodl-formal" aria-labelledby="aodl-three-title">
        <h2 id="aodl-three-title">Three objects, never substituted</h2>
        <Tex display math={String.raw`\mathrm{intent} \;\neq\; \mathrm{plan} \;\neq\; \mathcal{O}_t^{\mathrm{obs}}`} />
        <div className="aodl-objects">
          {OBJECTS.map((obj) => (
            <article key={obj.name}>
              <h3>{obj.name}</h3>
              <p>{obj.meaning}</p>
              <code>{obj.owner}</code>
            </article>
          ))}
        </div>
        <p className="aodl-note">
          Unsupported semantics fail closed. The validator does not infer swarm, consensus, intelligence, payment, or health from a drawing.
        </p>
      </section>

      <section className="aodl-formal" aria-labelledby="aodl-readings-title">
        <h2 id="aodl-readings-title">Readings</h2>
        <p>
          Intent, plan, and observed are three sheaves over the same graph — not three names for one thing.
          Compatible observations may glue; obstruction fails closed or a verifier may abduct.
          Never an invented edge, and never a fourth object standing in for missing receipts.
        </p>
        <div className="aodl-table-wrap">
          <table className="aodl-table">
            <thead>
              <tr><th>Cousin</th><th>Maps onto</th></tr>
            </thead>
            <tbody>
              {READINGS.map((row) => (
                <tr key={row.name}>
                  <td>{row.name}</td>
                  <td>{row.maps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="aodl-formal" aria-labelledby="aodl-tau-title">
        <h2 id="aodl-tau-title">Translation</h2>
        <p>
          The visual language is a decoder of declared metadata. Compilation is the partial map in the{' '}
          <a className="aodl-path" href={`${REPO}/blob/main/spec/translation.md`}>translation spec</a>.
          This table is that map, rendered from JSON — not a screenshot of cores.
        </p>
        <Tex display math={irMap.translation.latex} />
        <Tex
          display
          math={String.raw`\tau(\mathsf{silhouette}) = \begin{cases} (\Pi, E) & \text{status}=\texttt{expressible} \\ \bot & \text{otherwise} \end{cases}`}
        />
        <p className="aodl-rule">{irMap.rule}</p>

        <h3>Channels</h3>
        <p>Hue, geometry, runes, and cadence do not become HOTL kinds. Only topology compiles through the silhouette table.</p>
        <div className="aodl-table-wrap">
          <table className="aodl-table">
            <thead>
              <tr>
                <th>Channel</th>
                <th>Visual</th>
                <th>HOTL</th>
                <th>object</th>
                <th>Compile</th>
              </tr>
            </thead>
            <tbody>
              {channels.map(([id, ch]) => (
                <tr key={id} title={ch.job}>
                  <td><code>{id}</code></td>
                  <td>{ch.visual}</td>
                  <td>{ch.hotl ? <code>{ch.hotl}</code> : <Tex math={String.raw`\bot`} />}</td>
                  <td>{ch.object ? <code>{ch.object}</code> : '—'}</td>
                  <td><span className="aodl-compile" data-compile={ch.compile}>{compileLabel(ch.compile)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3>Policy kinds (inverse)</h3>
        <p>
          Inverse is a display hint. It never infers missing edges. <code>retry</code> has no silhouette.
        </p>
        <div className="aodl-table-wrap">
          <table className="aodl-table">
            <thead>
              <tr>
                <th><code>policies.kinds</code></th>
                <th>Silhouette</th>
              </tr>
            </thead>
            <tbody>
              {fromHotl.map(([kind, tid]) => (
                <tr key={kind}>
                  <td><code>{kind}</code></td>
                  <td>{tid ? <code>{tid}</code> : <Tex math={String.raw`\bot`} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="aodl-map" aria-labelledby="aodl-map-title">
        <h2 id="aodl-map-title">Silhouettes</h2>
        <p>
          Each unit is a living core of a declared coordination class. Click the core to break it
          into the silhouette — the actual pattern — then a node to edit language. Status{' '}
          <code>not-inferred</code> means the drawing exists and still fails closed until the listed
          policy is declared. Marketplace is allocation policy <Tex math={String.raw`\Pi_t`} />, not a product.
        </p>
        <div className="aodl-map__grid">
          {topologies.map(([id, topology]) => (
            <SilhouetteCard key={id} id={id} topology={topology} rec={irMap.topologies[id]} />
          ))}
        </div>
      </section>

      <section className="aodl-formal" aria-labelledby="aodl-craid-title">
        <h2 id="aodl-craid-title">Named hybrid — C(RAID)</h2>
        <p>
          Unlabeled <code>hybrid</code> stays <Tex math={String.raw`\bot`} />. The named program is Continuous Research → Analysis → Integration → Deployment.
          Feedback is <code>observation</code>. A <code>dependency</code> on D→R is a cycle and fails closed.
        </p>
        <pre className="aodl-kinds">{`policies.kinds: ["sequence", "retry", "fanout", "reducer", "human_gate"]`}</pre>
        <p>
          Fixture <code>examples/valid/craid.json</code>. Spec{' '}
          <a className="aodl-path" href={`${REPO}/blob/main/spec/craid.md`}>craid.md</a>. A hybrid badge is not C(RAID).
        </p>
      </section>

      <section className="aodl-formal" aria-labelledby="aodl-adapters-title">
        <h2 id="aodl-adapters-title">Adapters</h2>
        <p>
          Three protocol layers, never a fourth IR. Chain-of-thought trees are not orchestration graphs.
          Visual <Tex math={String.raw`\tau`} /> does not compile ToT into <code>fanout</code>.
        </p>
        <div className="aodl-table-wrap">
          <table className="aodl-table">
            <thead>
              <tr><th>Layer</th><th>Job</th></tr>
            </thead>
            <tbody>
              {ADAPTERS.map((row) => (
                <tr key={row.name}>
                  <td>{row.name}</td>
                  <td>{row.maps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="aodl-decoder" aria-labelledby="aodl-decoder-title">
        <h2 id="aodl-decoder-title">Visual decoder</h2>
        <p>
          Living-night cores compress declared metadata: provider hue, model geometry, effort orbits, topology envelope, mode rune, runtime cadence.
          They are <strong>not</strong> <Tex math={String.raw`\mathcal{O}_t`} />. Click a core to disclose the silhouette of its declared topology, then a node to edit.
          HomeForge / Solarpunk consumes this catalog; it does not own ids.
        </p>
        <AgentCoreLanguage />
      </section>

      <footer className="aodl-language__foot">
        <a href={`${REPO}/blob/main/docs/working-note.md`}>working note</a>
        <a href={`${REPO}/blob/main/spec/translation.md`}>translation</a>
        <a href={`${REPO}/blob/main/profiles/o8.md`}>o8 profile</a>
        <a href={`${REPO}/blob/main/profiles/langchain.md`}>langchain profile</a>
        <a href={`${REPO}/blob/main/spec/hotl-0.2.ebnf`}>EBNF</a>
        <a href={`${REPO}/blob/main/schema/hotl-0.2.schema.json`}>schema</a>
        <a href={REPO}>kvnloo/aodl</a>
      </footer>
    </div>
  );
}
