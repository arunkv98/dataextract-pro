import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { PDFExtractionPage } from './pages/PDFExtractionPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/pdf-extraction" element={<PDFExtractionPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
