import React from "react";

// Beautiful Owl SVG styled to match the project aesthetic (soft colors, rounded, modern)
const OwlSplash = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: 'linear-gradient(135deg, #232946 0%, #16161a 100%)'
  }}>
    <svg width="160" height="160" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="44" rx="28" ry="22" fill="#f9e7c2" stroke="#5a4632" strokeWidth="2"/>
      <ellipse cx="32" cy="28" rx="22" ry="22" fill="#fffbe6" stroke="#5a4632" strokeWidth="2"/>
      <ellipse cx="20" cy="28" rx="10" ry="12" fill="#fff" stroke="#5a4632" strokeWidth="2"/>
      <ellipse cx="44" cy="28" rx="10" ry="12" fill="#fff" stroke="#5a4632" strokeWidth="2"/>
      <circle cx="20" cy="30" r="4.5" fill="#5a4632"/>
      <circle cx="44" cy="30" r="4.5" fill="#5a4632"/>
      <circle cx="20" cy="30" r="2" fill="#fff"/>
      <circle cx="44" cy="30" r="2" fill="#fff"/>
      <polygon points="32,38 26,50 38,50" fill="#ffb300" stroke="#5a4632" strokeWidth="1.5"/>
      <path d="M10 18 Q20 2 32 10 Q44 2 54 18" fill="none" stroke="#5a4632" strokeWidth="2.5"/>
      <path d="M22 22 Q28 14 32 18 Q36 14 42 22" fill="none" stroke="#bfa76f" strokeWidth="2"/>
    </svg>
    <h1 style={{marginTop: 32, color: '#f4f4f8', fontWeight: 700, fontSize: 32, fontFamily: 'inherit', letterSpacing: 1}}>Welcome to Meeting AI</h1>
    <p style={{color: '#b8c1ec', fontSize: 18, marginTop: 8}}>Loading...</p>
  </div>
);

export default OwlSplash;
