import PromoBar from './components/PromoBar.jsx';
import Header from './components/Header.jsx';
import VehicleTypeBar from './components/VehicleTypeBar.jsx';
import CategoryNav from './components/CategoryNav.jsx';
import Hero from './components/Hero.jsx';
import { SelectionProvider } from './state/SelectionContext.jsx';

export default function App() {
  return (
    <SelectionProvider>
      <div className="min-w-[1280px] bg-white">
        <PromoBar />
        <Header />
        <VehicleTypeBar />
        <CategoryNav />
        <Hero />
      </div>
    </SelectionProvider>
  );
}
