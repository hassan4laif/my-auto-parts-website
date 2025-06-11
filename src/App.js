import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, onSnapshot, doc, deleteDoc, updateDoc, query } from 'firebase/firestore';

// --- Firebase Initialization (Global Scope for Singleton Instances) ---
// These global variables are expected to be provided by the Canvas environment.
// Fallbacks are included for local testing convenience, but should be correctly
// populated in a deployed Canvas environment.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
// __initial_auth_token is not used in this version, as we are implementing
// email/password authentication for admin access.

let app;
let db;
let auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (error) {
  console.error("Firebase initialization failed:", error);
  // In a real application, you might display a user-friendly error message here.
}

// --- Admin Configuration ---
// IMPORTANT: THIS HAS BEEN REPLACED WITH YOUR ACTUAL ADMIN UID!
const ADMIN_UID = "tD5p3Y4NSGbZmjnLfItkgbXUr6R2";

// --- Reusable Modal Component ---
const Modal = ({ show, title, message, onConfirm, onCancel }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 transform transition-all duration-300 scale-100">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">{title}</h3>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Header Component ---
const Header = ({ navigate, isAuthenticated, isAdmin, onLogout }) => {
  return (
    <header className="bg-gray-800 text-white p-4 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <h1 className="text-3xl font-bold text-yellow-400 mb-2 md:mb-0">Auto Parts Pro</h1>
        <nav>
          <ul className="flex flex-wrap justify-center space-x-4 md:space-x-6 text-lg">
            <li><button onClick={() => navigate('home')} className="hover:text-yellow-400 transition-colors duration-200 focus:outline-none">Home</button></li>
            <li><button onClick={() => navigate('products')} className="hover:text-yellow-400 transition-colors duration-200 focus:outline-none">Products</button></li>
            {isAdmin && (
              <li><button onClick={() => navigate('manage-products')} className="hover:text-yellow-400 transition-colors duration-200 focus:outline-none">Manage Products</button></li>
            )}
            <li><button onClick={() => navigate('about')} className="hover:text-yellow-400 transition-colors duration-200 focus:outline-none">About Us</button></li>
            <li><button onClick={() => navigate('contact')} className="hover:text-yellow-400 transition-colors duration-200 focus:outline-none">Contact</button></li>
            {isAuthenticated ? (
              <li><button onClick={onLogout} className="hover:text-red-400 transition-colors duration-200 focus:outline-none">Logout</button></li>
            ) : (
              <li><button onClick={() => navigate('login')} className="hover:text-green-400 transition-colors duration-200 focus:outline-none">Admin Login</button></li>
            )}
          </ul>
        </nav>
      </div>
</header>
  );
};

// --- Footer Component ---
const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white p-6 mt-8 rounded-t-lg">
      <div className="container mx-auto text-center">
        <p>&copy; {new Date().getFullYear()} Auto Parts Pro. All rights reserved.</p>
        <div className="flex justify-center space-x-4 mt-2">
          <a href="#" className="hover:text-yellow-400 transition-colors duration-200">Privacy Policy</a>
          <a href="#" className="hover:text-yellow-400 transition-colors duration-200">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};

// --- Home Page Component ---
const HomePage = ({ navigate }) => {
  return (
    <div className="container mx-auto p-4 flex-grow">
      <section className="hero bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg p-8 md:p-16 text-center shadow-xl flex flex-col justify-center items-center h-96">
        <h2 className="text-4xl md:text-6xl font-extrabold mb-4 text-yellow-400 drop-shadow-lg">Your One-Stop Shop for Quality Auto Parts</h2>
        <p className="text-lg md:text-xl mb-8 max-w-2xl">Discover a vast selection of genuine and aftermarket auto parts for all makes and models.</p>
        <button
          onClick={() => navigate('products')}
          className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 px-8 rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-300"
        >
          Explore Products
        </button>
      </section>

      <section className="features grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        <div className="feature-card bg-white p-6 rounded-lg shadow-lg text-center transform transition-transform hover:scale-105">
          <div className="text-5xl text-gray-800 mb-4">??</div>
          <h3 className="text-xl font-semibold mb-2">Wide Selection</h3>
          <p className="text-gray-600">From engine components to body kits, find everything you need.</p>
        </div>
        <div className="feature-card bg-white p-6 rounded-lg shadow-lg text-center transform transition-transform hover:scale-105">
          <div className="text-5xl text-gray-800 mb-4">?</div>
          <h3 className="text-xl font-semibold mb-2">Quality Assured</h3>
          <p className="text-gray-600">Only genuine and high-quality aftermarket parts.</p>
        </div>
        <div className="feature-card bg-white p-6 rounded-lg shadow-lg text-center transform transition-transform hover:scale-105">
          <div className="text-5xl text-gray-800 mb-4">??</div>
          <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
          <p className="text-gray-600">Get your parts delivered right to your doorstep, quickly.</p>
        </div>
      </section>
    </div>
  );
};

// --- Products Page Component (Public View) ---
const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!db) {
      setError("Database not initialized.");
      setLoading(false);
      return;
    }

    const productsCollectionRef = collection(db, `artifacts/${appId}/public/data/products`);
    const unsubscribe = onSnapshot(productsCollectionRef,
      (snapshot) => {
        const productsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Sort products by creation date, newest first
        productsData.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
        setProducts(productsData);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching products:", err);
        setError("Failed to load products. Please try again.");
        setLoading(false);
      }
    );

    return () => unsubscribe(); // Cleanup listener
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-500"></div>
        <p className="ml-4 text-gray-600 text-lg">Loading products...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-8 text-red-600 text-xl font-semibold">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4 flex-grow">
      <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center">Our Auto Parts Selection</h2>
      {products.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">No products available yet. Check back soon!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-transform hover:scale-105 hover:shadow-xl group">
              <img
                src={product.imageUrl || `https://placehold.co/400x300/e0e0e0/555555?text=${encodeURIComponent(product.name || 'Product Image')}`}
                alt={product.name}
                className="w-full h-48 object-cover rounded-t-lg transition-transform duration-300 group-hover:scale-110"
                onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x300/e0e0e0/555555?text=${encodeURIComponent('Image Error')}`; }}
              />
              <div className="p-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-2 truncate">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                <p className="text-gray-900 font-bold text-lg">Price: ${parseFloat(product.price).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Product Form (for Add and Edit) ---
const ProductForm = ({ initialData = {}, onSubmit, submitButtonText }) => {
  const [name, setName] = useState(initialData.name || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [price, setPrice] = useState(initialData.price || '');
  const [imageUrl, setImageUrl] = useState(initialData.imageUrl || '');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!name || !description || !price) {
      setMessageType('error');
      setMessage('Please fill in all required fields (Name, Description, Price).');
      return;
    }
    if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      setMessageType('error');
      setMessage('Price must be a valid positive number.');
      return;
    }

    try {
      await onSubmit({ name, description, price: parseFloat(price), imageUrl });
      setMessageType('success');
      setMessage('Operation successful!');
      if (!initialData.id) { // Only clear form for new products
        setName('');
        setDescription('');
        setPrice('');
        setImageUrl('');
      }
    } catch (error) {
      setMessageType('error');
      setMessage(`Operation failed: ${error.message}`);
      console.error("Form submission error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div className={`p-3 mb-4 rounded-md text-center ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}
      <div>
        <label htmlFor="productName" className="block text-gray-700 text-sm font-bold mb-2">Product Name <span className="text-red-500">*</span></label>
        <input
          type="text"
          id="productName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500"
          placeholder="e.g., Brake Pad Set"
          required
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Description <span className="text-red-500">*</span></label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows="4"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-y"
          placeholder="Detailed description of the product..."
          required
        ></textarea>
      </div>
      <div>
        <label htmlFor="price" className="block text-gray-700 text-sm font-bold mb-2">Price ($) <span className="text-red-500">*</span></label>
        <input
          type="number"
          id="price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          step="0.01"
          min="0"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500"
          placeholder="e.g., 49.99"
          required
        />
      </div>
      <div>
        <label htmlFor="imageUrl" className="block text-gray-700 text-sm font-bold mb-2">Image URL (Optional)</label>
        <input
          type="url"
          id="imageUrl"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500"
          placeholder="e.g., https://example.com/image.jpg"
        />
        <p className="text-gray-500 text-xs mt-1">If left empty, a placeholder image will be used.</p>
      </div>
      <button
        type="submit"
        className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 px-4 rounded-lg shadow-md transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-yellow-300"
      >
        {submitButtonText}
      </button>
    </form>
  );
};

// --- Product Management Page (Admin Only) ---
const ProductManagementPage = ({ userId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null); // null or product object
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const fetchProducts = useCallback(() => {
    if (!db) {
      setError("Database not initialized.");
      setLoading(false);
      return;
    }
    const productsCollectionRef = collection(db, `artifacts/${appId}/public/data/products`);
    const unsubscribe = onSnapshot(productsCollectionRef,
      (snapshot) => {
        const productsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Sort products by creation date, newest first for easier management
        productsData.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
        setProducts(productsData);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching products for management:", err);
        setError("Failed to load products for management.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    return fetchProducts();
  }, [fetchProducts]);

  const handleAddProduct = async (productData) => {
    if (!db || !auth.currentUser) throw new Error("Authentication/Database not ready.");
    const productsCollectionRef = collection(db, `artifacts/${appId}/public/data/products`);
    await addDoc(productsCollectionRef, {
      ...productData,
      createdAt: new Date(),
      addedBy: userId
    });
  };

  const handleUpdateProduct = async (id, productData) => {
    if (!db || !auth.currentUser) throw new Error("Authentication/Database not ready.");
    const productDocRef = doc(db, `artifacts/${appId}/public/data/products`, id);
    await updateDoc(productDocRef, {
      ...productData,
      updatedAt: new Date(),
      updatedBy: userId
    });
    setEditingProduct(null); // Exit edit mode
  };

  const handleDeleteProduct = async () => {
    if (!db || !auth.currentUser || !productToDelete) return;
    try {
      await deleteDoc(doc(db, `artifacts/${appId}/public/data/products`, productToDelete.id));
      console.log(`Product ${productToDelete.id} deleted.`);
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (err) {
      console.error("Error deleting product:", err);
      // In a real app, show error feedback
    }
  };

  const confirmDelete = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-500"></div>
        <p className="ml-4 text-gray-600 text-lg">Loading products for management...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-8 text-red-600 text-xl font-semibold">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4 flex-grow">
      <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center">Manage Your Products</h2>

      {/* Add New Product Section */}
      <div className="bg-white p-8 rounded-lg shadow-lg mb-12">
        <h3 className="text-2xl font-semibold text-gray-800 mb-6">Add New Product</h3>
        <ProductForm onSubmit={handleAddProduct} submitButtonText="Add Product" />
      </div>

      {/* Existing Products List */}
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h3 className="text-2xl font-semibold text-gray-800 mb-6">Existing Products</h3>
        {products.length === 0 ? (
          <p className="text-center text-gray-500 text-lg">No products added yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-gray-200">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Image</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Price</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <img
                        src={product.imageUrl || `https://placehold.co/60x60/e0e0e0/555555?text=Img`}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-md"
                        onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/60x60/e0e0e0/555555?text=Err`; }}
                      />
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-800">{product.name}</td>
                    <td className="py-3 px-4 text-gray-700">${parseFloat(product.price).toFixed(2)}</td>
                    <td className="py-3 px-4 space-x-2">
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => confirmDelete(product)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Product Modal/Form */}
      {editingProduct && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-auto transform transition-all duration-300 scale-100 relative">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6">Edit Product: {editingProduct.name}</h3>
            <button
              onClick={() => setEditingProduct(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-3xl leading-none focus:outline-none"
            >
              &times;
            </button>
            <ProductForm
              initialData={editingProduct}
              onSubmit={(data) => handleUpdateProduct(editingProduct.id, data)}
              submitButtonText="Update Product"
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        title="Confirm Deletion"
        message={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteProduct}
        onCancel={cancelDelete}
      />
    </div>
  );
};


// --- Login Page Component ---
const LoginPage = ({ navigate, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!auth) {
      setError("Authentication service not initialized.");
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLoginSuccess(); // Callback to update parent state
      navigate('manage-products'); // Redirect to product management
    } catch (err) {
      console.error("Login error:", err.code, err.message);
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential': // Generic error for wrong email/password
          setError('Invalid email or password.');
          break;
        case 'auth/invalid-email':
          setError('Please enter a valid email address.');
          break;
        case 'auth/too-many-requests':
          setError('Too many login attempts. Please try again later.');
          break;
        default:
          setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 flex-grow flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-xl border border-gray-200">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Admin Login</h2>
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-center">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="admin@example.com"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="********"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 px-4 rounded-lg shadow-md transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-yellow-300 flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-900 mr-2"></span>
            ) : null}
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Only authorized personnel can log in here.
        </p>
      </div>
    </div>
  );
};

// --- About Us Component ---
const AboutPage = () => {
  return (
    <div className="container mx-auto p-4 flex-grow">
      <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center">About Auto Parts Pro</h2>
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-lg text-lg text-gray-700 leading-relaxed">
        <p className="mb-4">
          Welcome to <span className="font-semibold text-yellow-600">Auto Parts Pro</span>, your trusted source for high-quality auto parts and accessories. We are passionate about cars and dedicated to providing our customers with the best products to keep their vehicles running smoothly and safely.
        </p>
        <p className="mb-4">
          Founded on the principles of reliability and customer satisfaction, we meticulously source our inventory from reputable manufacturers. Whether you're a professional mechanic or a DIY enthusiast, you'll find a comprehensive range of parts for various makes and models, from essential engine components to stylish exterior enhancements.
        </p>
        <p>
          Our commitment extends beyond just selling parts; we strive to offer exceptional service and support to ensure you find exactly what you need. Thank you for choosing Auto Parts Pro – where quality meets performance.
        </p>
      </div>
    </div>
  );
};

// --- Contact Page Component ---
const ContactPage = () => {
  const [formStatus, setFormStatus] = useState(''); // 'success', 'error', ''
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setFormStatus('');

    // Simulate sending an email or form submission
    setTimeout(() => {
      // In a real application, you'd send this data to a backend server or a service like Formspree.
      // For this example, we'll just simulate success.
      setFormStatus('success');
      setLoading(false);
      e.target.reset(); // Clear the form
    }, 1500);
  };

  return (
    <div className="container mx-auto p-4 flex-grow">
      <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center">Contact Us</h2>
      <div className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-lg text-lg text-gray-700 leading-relaxed">
        <p className="mb-4">
          Have questions or need assistance? Don't hesitate to reach out to us! Our team is here to help.
        </p>
        <ul className="list-disc list-inside space-y-2 mb-6">
          <li><strong>Phone:</strong> +92 51 1234567</li>
          <li><strong>Email:</strong> info@autopartspro.com</li>
          <li><strong>Address:</strong> 123 Auto Street, Industrial Area, Islamabad, Pakistan</li>
        </ul>
        <p className="mb-4">
          Alternatively, you can fill out the form below, and we'll get back to you as soon as possible.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">Your Name</label>
            <input
              type="text"
              id="name"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="John Doe"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Your Email</label>
            <input
              type="email"
              id="email"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="john.doe@example.com"
              required
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-gray-700 text-sm font-bold mb-2">Your Message</label>
            <textarea
              id="message"
              rows="5"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-y"
              placeholder="Type your message here..."
              required
            ></textarea>
          </div>
          <button
            type="submit"
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 px-4 rounded-lg shadow-md transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-yellow-300 flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-900 mr-2"></span>
            ) : null}
            {loading ? 'Sending...' : 'Send Message'}
          </button>
          {formStatus === 'success' && (
            <div className="bg-green-100 text-green-700 p-3 rounded-md text-center mt-4">
              Your message has been sent successfully!
            </div>
          )}
        </form>
      </div>
    </div>
  );
};


// --- Main App Component ---
const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState(null); // Keep track of the actual user ID
  const [authInitialized, setAuthInitialized] = useState(false); // New state to confirm auth is ready

  useEffect(() => {
    if (!auth) {
      console.error("Firebase Auth instance is not available.");
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        setUserId(user.uid);
        // Check if the authenticated user is the admin
        setIsAdmin(user.uid === ADMIN_UID);
        console.log("Auth State: Logged in.", user.uid, "Is Admin:", user.uid === ADMIN_UID);
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setUserId(null);
        console.log("Auth State: Logged out.");
      }
      setAuthInitialized(true); // Auth state has been checked at least once
    });

    return () => unsubscribeAuth(); // Cleanup listener on component unmount
  }, []); // Empty dependency array means this runs once on mount

  const navigate = (page) => {
    setCurrentPage(page);
  };

  const handleLogout = async () => {
    if (!auth) {
      console.error("Auth service not available for logout.");
      return;
    }
    try {
      await signOut(auth);
      navigate('home'); // Redirect to home page after logout
      console.log("User logged out successfully.");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleLoginSuccess = () => {
    // This function will be called from LoginPage upon successful login
    // The onAuthStateChanged listener above will handle setting isAuthenticated and isAdmin
    setCurrentPage('manage-products'); // Redirect to manage products after successful login
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-100 antialiased">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
          body {
            font-family: 'Inter', sans-serif;
          }
          /* Custom scrollbar for a cleaner look */
          ::-webkit-scrollbar {
            width: 10px;
          }
          ::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        `}
      </style>
      {/* Font Awesome for potential icons, though emojis are preferred for simplicity */}
      <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet"></link>

      <Header
        navigate={navigate}
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
        onLogout={handleLogout}
      />

      <main className="flex-grow">
        {/* Conditional rendering for pages */}
        {currentPage === 'home' && <HomePage navigate={navigate} />}
        {currentPage === 'products' && <ProductsPage />}
        {currentPage === 'about' && <AboutPage />}
        {currentPage === 'contact' && <ContactPage />}
        {currentPage === 'login' && <LoginPage navigate={navigate} onLoginSuccess={handleLoginSuccess} />}
        {currentPage === 'manage-products' && isAuthenticated && isAdmin && authInitialized ? (
          <ProductManagementPage userId={userId} />
        ) : currentPage === 'manage-products' ? (
            <div className="container mx-auto p-4 text-center text-red-600 text-xl font-semibold flex-grow flex items-center justify-center">
              Access Denied. Please log in as an administrator to manage products.
            </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
};

export default App;