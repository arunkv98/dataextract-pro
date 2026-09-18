import React from 'react';
import { Header } from '../components/Header';
import { dummyBPs } from '../data/bps';
import { BPCard } from '../components/BPCard';
import { Footer } from '../components/Footer';
import { Hero } from '../components/Hero';

export function HomePage() {
  return (
    <>
      <Header />
      <Hero />
      <section className="features">
        <div className="container">
          <div className="bp-grid">
            {dummyBPs.map(bp => (
              <BPCard key={bp.id} bp={bp} />
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
