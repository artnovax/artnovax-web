import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { CartProvider } from './context/CartContext';
import CartDrawer from './components/CartDrawer';
import Home from './pages/Home';
import About from './pages/About';
import OurWork from './pages/OurWork';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import EventRegister from './pages/EventRegister';
import FounderDetail from './pages/FounderDetail';
import Volunteer from './pages/Volunteer';
import VolunteerApply from './pages/VolunteerApply';
import PartnerForm from './pages/PartnerForm';
import Support from './pages/Support';
import Research from './pages/Research';
import ArticleDetail from './pages/ArticleDetail';
import AppPage from './pages/AppPage';
import GetInvolved from './pages/GetInvolved';
import Contact from './pages/Contact';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import NewsletterArchive from './pages/NewsletterArchive';
import NewsletterDetail from './pages/NewsletterDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Admin from './pages/Admin';
import InfoPage from './pages/InfoPage';

function App() {
  return (
    <div className="App">
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/our-work" element={<OurWork />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:slug" element={<EventDetail />} />
            <Route path="/events/:slug/register" element={<EventRegister />} />
            <Route path="/founders/:slug" element={<FounderDetail />} />
            <Route path="/get-involved/volunteer" element={<Volunteer />} />
            <Route path="/get-involved/volunteer/:slug" element={<VolunteerApply />} />
            <Route path="/get-involved/partner" element={<PartnerForm />} />
            <Route path="/get-involved/support" element={<Support />} />
            <Route path="/support" element={<Support />} />
            <Route path="/support/thanks" element={<Support />} />
            <Route path="/research" element={<Research />} />
            <Route path="/research/approach" element={<InfoPage pageKey="research_approach" activePath="/research" />} />
            <Route path="/research/:slug" element={<ArticleDetail />} />
            <Route path="/newsletters" element={<NewsletterArchive />} />
            <Route path="/newsletters/:slug" element={<NewsletterDetail />} />
            <Route path="/app" element={<AppPage />} />
            <Route path="/get-involved" element={<GetInvolved />} />
            <Route path="/get-involved/shop" element={<Shop />} />
            <Route path="/get-involved/shop/:id" element={<ProductDetail />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/shop/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<InfoPage pageKey="privacy" />} />
            <Route path="/terms" element={<InfoPage pageKey="terms" />} />
            <Route path="/accessibility" element={<InfoPage pageKey="accessibility" />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Home />} />
          </Routes>
          <CartDrawer />
        </BrowserRouter>
        <Toaster />
      </CartProvider>
    </div>
  );
}

export default App;
