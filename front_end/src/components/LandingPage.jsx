import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import "./LandingPage.css";

const fadeUpVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

const LoopingStory = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="story-container">
      {/* 1. Patient-clinician conversation */}
      <motion.div 
        className="story-scene"
        initial={{ opacity: 0 }}
        animate={{ opacity: step === 0 ? 1 : 0, scale: step === 0 ? 1 : 0.95 }}
        transition={{ duration: 0.8 }}
      >
        <div className="chat-bubble user-bubble">
          <div className="line line-short"></div>
          <div className="line"></div>
        </div>
        <div className="chat-bubble clinician-bubble">
          <div className="line"></div>
          <div className="line line-medium"></div>
        </div>
      </motion.div>

      {/* 2. Questionnaire cursor */}
      <motion.div 
        className="story-scene"
        initial={{ opacity: 0 }}
        animate={{ opacity: step === 1 ? 1 : 0, y: step === 1 ? 0 : 20 }}
        transition={{ duration: 0.8 }}
      >
        <div className="mock-quiz">
          <div className="mock-title"></div>
          <div className="mock-option mock-selected"></div>
          <div className="mock-option"></div>
          <motion.div 
            className="mock-cursor"
            animate={step === 1 ? { x: [30, -10, 0], y: [40, 0, 5] } : {}}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M4 4L11 20L14 14L20 11L4 4Z" fill="#ffffff" stroke="#1E2A22" strokeWidth="2"/>
            </svg>
          </motion.div>
        </div>
      </motion.div>

      {/* 3. Screening summary */}
      <motion.div 
        className="story-scene"
        initial={{ opacity: 0 }}
        animate={{ opacity: step === 2 ? 1 : 0, y: step === 2 ? 0 : 20 }}
        transition={{ duration: 0.8 }}
      >
        <div className="mock-report">
          <div className="mock-header">
            <div className="mock-avatar"></div>
            <div className="mock-lines">
              <div className="line"></div>
              <div className="line line-short"></div>
            </div>
          </div>
          <div className="mock-stats">
            <div className="mock-stat-box">
              <span className="stat-num">9/10</span>
              <span className="stat-label">Reported</span>
            </div>
            <div className="mock-stat-box">
              <span className="stat-num">7-8</span>
              <span className="stat-label">Estimated</span>
            </div>
          </div>
          <div className="mock-bar-container">
            <motion.div 
              className="mock-bar"
              initial={{ width: 0 }}
              animate={step === 2 ? { width: "75%" } : { width: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
            ></motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default function LandingPage({ onBegin }) {
  return (
    <div className="landing-page">
      <div className="grain"></div>

      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-brand">
          ANATOME<span className="brand-dot">.</span>
        </div>
        <div className="nav-links">
          <a href="#how-it-works">How it works</a>
          <a href="#team">Team</a>
        </div>
        <button className="nav-cta" onClick={onBegin}>Start test</button>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <motion.div 
          className="hero-content"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.p className="caption" variants={fadeUpVariant}>
            Comprehensive Pain Intelligence
          </motion.p>
          <motion.h1 className="hero-title" variants={fadeUpVariant}>
            A clearer path from pain to understanding.
          </motion.h1>
          <motion.p className="hero-subtitle" variants={fadeUpVariant}>
            ANATOME listens to the details that matter, combining interactive 3D pain mapping with a comprehensive questionnaire to create structured context for the next step in care.
          </motion.p>
          <motion.div className="hero-ctas" variants={fadeUpVariant}>
            <button className="btn-secondary" onClick={() => document.getElementById('how-it-works').scrollIntoView({behavior: 'smooth'})}>Watch the story</button>
            <button className="btn-primary" onClick={onBegin}>Start test</button>
          </motion.div>
        </motion.div>

        <motion.div 
          className="hero-visual"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <LoopingStory />
        </motion.div>
      </section>

      {/* 1. The Problem */}
      <section className="problem-section" id="problem">
        <motion.div 
          className="section-content"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.p className="caption text-center" variants={fadeUpVariant}>The Problem</motion.p>
          <motion.h2 className="section-title text-center" variants={fadeUpVariant}>
            Pain is personal. Most forms are not.
          </motion.h2>
          <motion.p className="section-body text-center" variants={fadeUpVariant}>
            Static symptom forms flatten complex human experiences into generic text lists. When patients can't accurately point to where it hurts, critical nuance is lost before care even begins.
          </motion.p>
        </motion.div>
      </section>

      {/* 2. Why Conventional Checkers Fail */}
      <section className="fail-section">
        <motion.div 
          className="section-content"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.h2 className="section-title text-center" variants={fadeUpVariant}>
            Words aren't always enough.
          </motion.h2>
          <div className="cards-grid">
            <motion.div className="feature-card" variants={fadeUpVariant}>
              <div className="card-icon">Intake</div>
              <h3>Text-only descriptions</h3>
              <p>Trying to describe exact anatomical locations using only words is difficult for patients and ambiguous for providers.</p>
            </motion.div>
            <motion.div className="feature-card" variants={fadeUpVariant}>
              <div className="card-icon">Scale</div>
              <h3>Raw numbers</h3>
              <p>A "7 out of 10" means different things to different people. Without functional context, raw numbers mislead.</p>
            </motion.div>
            <motion.div className="feature-card" variants={fadeUpVariant}>
              <div className="card-icon">Context</div>
              <h3>Lost context</h3>
              <p>Important details about onset, triggers, and emotional toll are often completely ignored by simple intake sheets.</p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* 3. How ANATOME Works */}
      <section className="how-section" id="how-it-works">
        <motion.div 
          className="section-content"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.h2 className="section-title text-center" variants={fadeUpVariant}>
            One experience. Better context.
          </motion.h2>
          
          <div className="steps-container">
            <motion.div className="step-row" variants={fadeUpVariant}>
              <div className="step-number">01</div>
              <div className="step-text">
                <h3>Map</h3>
                <p>Pinpoint exact pain locations in full 3D space, capturing precise anatomical context and severity instantly.</p>
              </div>
            </motion.div>
            <motion.div className="step-row" variants={fadeUpVariant}>
              <div className="step-number">02</div>
              <div className="step-text">
                <h3>Detail</h3>
                <p>Complete a focused questionnaire to provide essential context on triggers, history, and functional impact.</p>
              </div>
            </motion.div>
            <motion.div className="step-row" variants={fadeUpVariant}>
              <div className="step-number">03</div>
              <div className="step-text">
                <h3>Synthesize</h3>
                <p>Our AI synthesizes your 3D pain map, multiple visual angles, and questionnaire responses into a clinical-ready PDF report.</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* 4. Adaptive Reasoning */}
      <section className="reasoning-section">
        <motion.div 
          className="reasoning-container"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.div className="reasoning-text" variants={fadeUpVariant}>
            <h2 className="section-title">Built to synthesize complex signals.</h2>
            <p className="section-body">
              ANATOME's AI engine analyzes the combination of your 3D anatomical data, pain descriptors, and detailed questionnaire responses to generate a cohesive, professional clinical picture.
            </p>
          </motion.div>
          
          <motion.div className="reasoning-visuals" variants={staggerContainer}>
            <motion.div className="reasoning-card" variants={fadeUpVariant}>
              <div className="rc-header">3D Map + Questionnaire</div>
              <div className="rc-arrow">→</div>
              <div className="rc-result">Comprehensive Clinical Context</div>
            </motion.div>
            <motion.div className="reasoning-card" variants={fadeUpVariant}>
              <div className="rc-header">Multi-angle Snapshots</div>
              <div className="rc-arrow">→</div>
              <div className="rc-result">Visual Anatomic Reference</div>
            </motion.div>
            <motion.div className="reasoning-card" variants={fadeUpVariant}>
              <div className="rc-header">LLM Analysis</div>
              <div className="rc-arrow">→</div>
              <div className="rc-result">Professional PDF Report</div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* 5. Clinical-Ready Context */}
      <section className="clinical-section">
        <motion.div 
          className="section-content"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.h2 className="section-title text-center" variants={fadeUpVariant}>
            A report that provides the full picture.
          </motion.h2>
          <motion.p className="section-body text-center" variants={fadeUpVariant}>
            ANATOME cross-checks self-reported pain regions, functional impact, descriptors, and associated symptoms to generate a structured clinical summary for your healthcare provider.
          </motion.p>
          
          <motion.div className="clinical-report-card" variants={fadeUpVariant}>
            <div className="cr-header">Screening Summary</div>
            <div className="cr-stats">
              <div className="cr-stat">
                <span>Regions Marked</span>
                <strong>2</strong>
              </div>
              <div className="cr-stat highlight">
                <span>Avg Severity</span>
                <strong>7 / 10</strong>
              </div>
            </div>
            <div className="cr-progress">
              <div className="cr-label">
                <span>Symptoms Recorded</span>
              </div>
            </div>
            <div className="cr-patterns">
              <span>✓ Nausea, Sweating</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* 6. Meet the Team */}
      <section className="team-section" id="team">
        <motion.div 
          className="section-content"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.h2 className="section-title text-center" variants={fadeUpVariant}>
            Meet the Team
          </motion.h2>
          <div className="team-grid">
            {[
              { name: "Pranav Arun Pillai", role: "UI/UX Designer · Lead Researcher · Project Coordinator" },
              { name: "Arush Banerjee", role: "Main Front-End Lead · Team Lead · 3D Anatomy Developer" },
              { name: "Kyle Hwang", role: "Lead Software Engineer · AI Model Developer" },
              { name: "Mustafa Ali", role: "AI Model Developer" }
            ].map((member, i) => (
              <motion.div className="team-card" key={i} variants={fadeUpVariant}>
                <h3>{member.name}</h3>
                <p>{member.role}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* 7. Final CTA */}
      <section className="cta-section">
        <motion.div 
          className="section-content text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <motion.h2 className="section-title" variants={fadeUpVariant}>
            Start with a better question.
          </motion.h2>
          <motion.p className="section-body" variants={fadeUpVariant}>
            A focused screening conversation takes only a few minutes.
          </motion.p>
          <motion.button className="btn-primary btn-large" onClick={onBegin} variants={fadeUpVariant}>
            Start your test
          </motion.button>
        </motion.div>
      </section>

      {/* Footer / Disclaimer */}
      <footer className="footer-disclaimer">
        <p>ANATOME is an educational clinical screening tool and does not provide medical diagnoses. Always consult a licensed healthcare professional.</p>
      </footer>
    </div>
  );
}
