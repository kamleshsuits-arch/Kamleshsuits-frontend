import ProductList from '../components/product/ProductList';
import SEO from '../components/common/SEO';

export default function Products() {
  return <>
    <SEO title="Shop the Collection" url="/product" description="Explore suits and ethnic wear. Find your favorite styles by color, occasion and price." />
    <div id="collection-section" className="scroll-mt-16 md:scroll-mt-24">
      <ProductList />
    </div>
  </>;
}
