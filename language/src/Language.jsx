import React from 'react';
import { AgentCoreLanguage, TopologyBadge } from './AgentCoreLanguage.jsx';
import visual from '../../encodings/visual.json';
import irMap from '../../encodings/ir-map.json';

export function Language() {
  const topologies = Object.entries(visual.topologies);
  return (
    <div className="aodl-language">
      <header className="aodl-language__hero">
        <h1>AODL language</h1>
        <p>
          Visual encoding of declared orchestration. Cores compress provider, model, effort, topology, mode, and runtime cadence.
          Topology silhouettes compile only through <code>encodings/ir-map.json</code>. Shape is not a HOTL kind.
        </p>
      </header>
      <AgentCoreLanguage />
      <section className="aodl-map" aria-labelledby="aodl-map-title">
        <h2 id="aodl-map-title">IR map</h2>
        <p>
          Each silhouette has an explicit HOTL 0.2 status. <code>not-inferred</code> means the drawing exists and still
          fails closed until the listed policies are declared. Marketplace is allocation policy, not a product.
        </p>
        <div className="aodl-map__grid">
          {topologies.map(([id, topology]) => {
            const rec = irMap.topologies[id];
            const kinds = rec.policies?.kinds;
            return (
              <article className="aodl-map__card" key={id}>
                <header>
                  <b>{topology.label}</b>
                  <span className="aodl-map__status" data-status={rec.status}>{rec.status}</span>
                </header>
                <TopologyBadge topologyId={id} providerId="multi" label={`${topology.label} mapped ${rec.status}`} />
                <p>{rec.note || topology.description}</p>
                {kinds ? <code>policies.kinds: {kinds.join(', ')}</code> : null}
                {rec.example ? <code>{rec.example}</code> : null}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
