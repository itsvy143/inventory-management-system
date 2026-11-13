// ========================================
// 1. GET HTML ELEMENTS
// ========================================

const productForm = document.getElementById("product-form");

const productIdInput = document.getElementById("product-id");
const productNameInput = document.getElementById("product-name");
const productPriceInput = document.getElementById("product-price");
const productQuantityInput = document.getElementById("product-quantity");

const productList = document.getElementById("product-list");
const searchInput = document.getElementById("search-input");
const stockFilter = document.getElementById("stock-filter");

const totalProducts = document.getElementById("total-products");
const totalUnits = document.getElementById("total-units");
const inventoryValue = document.getElementById("inventory-value");
const lowStockCount = document.getElementById("low-stock-count");

const emptyMessage = document.getElementById("empty-message");
const formTitle = document.getElementById("form-title");
const submitButton = document.getElementById("submit-button");
const cancelEditButton = document.getElementById("cancel-edit-button");

// ========================================
// 2. INVENTORY VARIABLES
// ========================================

const LOW_STOCK_LIMIT = 5;

let products = [];
let editingProductId = null;

// ========================================
// 3. LOAD SAVED PRODUCTS
// ========================================

try {
  const savedProducts = JSON.parse(localStorage.getItem("inventoryProducts"));

  products = Array.isArray(savedProducts) ? savedProducts : [];
} catch (error) {
  products = [];
}

// ========================================
// 4. SAVE PRODUCTS
// ========================================

function saveProducts() {
  localStorage.setItem("inventoryProducts", JSON.stringify(products));
}

// ========================================
// 5. FORMAT PHILIPPINE CURRENCY
// ========================================

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
}

// ========================================
// 6. GET STOCK STATUS
// ========================================

function getStockStatus(quantity) {
  if (quantity === 0) {
    return "Out of Stock";
  }

  if (quantity <= LOW_STOCK_LIMIT) {
    return "Low Stock";
  }

  return "In Stock";
}

// ========================================
// 7. RESET PRODUCT FORM
// ========================================

function resetProductForm() {
  productForm.reset();

  editingProductId = null;

  formTitle.textContent = "Add a Product";
  submitButton.textContent = "Add Product";

  cancelEditButton.hidden = true;
}

// ========================================
// 8. ADD OR UPDATE PRODUCT
// ========================================

productForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const productId = productIdInput.value.trim();
  const productName = productNameInput.value.trim();
  const price = Number(productPriceInput.value);
  const quantity = Number(productQuantityInput.value);

  // Validate product information
  if (
    productId === "" ||
    productName === "" ||
    !Number.isFinite(price) ||
    price <= 0 ||
    !Number.isSafeInteger(quantity) ||
    quantity < 0
  ) {
    alert("Please enter valid product information.");
    return;
  }

  // Check for duplicate product IDs
  const duplicateProduct = products.some(function (product) {
    return (
      product.productId.toLowerCase() === productId.toLowerCase() &&
      product.id !== editingProductId
    );
  });

  if (duplicateProduct) {
    alert("This Product ID already exists.");
    return;
  }

  if (editingProductId !== null) {
    // Update existing product
    products = products.map(function (product) {
      if (product.id === editingProductId) {
        return {
          ...product,
          productId: productId,
          name: productName,
          price: price,
          quantity: quantity,
        };
      }

      return product;
    });

    alert("Product updated successfully!");
  } else {
    // Add new product
    const newProduct = {
      id: Date.now(),
      productId: productId,
      name: productName,
      price: price,
      quantity: quantity,
    };

    products.push(newProduct);
  }

  saveProducts();
  displayProducts();
  updateSummary();
  resetProductForm();
});

// ========================================
// 9. DISPLAY PRODUCTS
// ========================================

function displayProducts() {
  productList.innerHTML = "";

  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedFilter = stockFilter.value;

  const filteredProducts = products.filter(function (product) {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm) ||
      product.productId.toLowerCase().includes(searchTerm);

    let matchesFilter = true;

    if (selectedFilter === "in-stock") {
      matchesFilter = product.quantity > LOW_STOCK_LIMIT;
    } else if (selectedFilter === "low-stock") {
      matchesFilter =
        product.quantity > 0 && product.quantity <= LOW_STOCK_LIMIT;
    } else if (selectedFilter === "out-of-stock") {
      matchesFilter = product.quantity === 0;
    }

    return matchesSearch && matchesFilter;
  });

  // Display empty message when no products match
  if (filteredProducts.length === 0) {
    emptyMessage.hidden = false;

    if (products.length === 0) {
      emptyMessage.textContent = "No products yet. Add your first product!";
    } else {
      emptyMessage.textContent = "No products match your search or filter.";
    }
  } else {
    emptyMessage.hidden = true;
  }

  filteredProducts.forEach(function (product) {
    const row = document.createElement("tr");

    // Product ID
    const idCell = document.createElement("td");
    idCell.textContent = product.productId;

    // Product name
    const nameCell = document.createElement("td");
    nameCell.textContent = product.name;

    // Unit price
    const priceCell = document.createElement("td");
    priceCell.textContent = formatCurrency(product.price);

    // Quantity
    const quantityCell = document.createElement("td");
    quantityCell.textContent = product.quantity;

    // Stock status
    const statusCell = document.createElement("td");
    const statusBadge = document.createElement("span");

    const status = getStockStatus(product.quantity);

    statusBadge.className = "stock-status";

    if (status === "In Stock") {
      statusBadge.classList.add("in-stock");
    } else if (status === "Low Stock") {
      statusBadge.classList.add("low-stock");
    } else {
      statusBadge.classList.add("out-of-stock");
    }

    statusBadge.textContent = status;
    statusCell.appendChild(statusBadge);

    // Total product value
    const valueCell = document.createElement("td");

    valueCell.textContent = formatCurrency(product.price * product.quantity);

    // Action buttons
    const actionCell = document.createElement("td");

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "edit-button";
    editButton.textContent = "Edit";
    editButton.dataset.id = product.id;
    editButton.setAttribute("aria-label", `Edit ${product.name}`);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Delete";
    deleteButton.dataset.id = product.id;
    deleteButton.setAttribute("aria-label", `Delete ${product.name}`);

    actionCell.append(editButton, deleteButton);

    // Add all cells to the row
    row.append(
      idCell,
      nameCell,
      priceCell,
      quantityCell,
      statusCell,
      valueCell,
      actionCell,
    );

    productList.appendChild(row);
  });
}

// ========================================
// 10. UPDATE INVENTORY SUMMARY
// ========================================

function updateSummary() {
  const productCount = products.length;

  const unitCount = products.reduce(function (total, product) {
    return total + product.quantity;
  }, 0);

  const totalValue = products.reduce(function (total, product) {
    return total + product.price * product.quantity;
  }, 0);

  const lowStockProducts = products.filter(function (product) {
    return product.quantity > 0 && product.quantity <= LOW_STOCK_LIMIT;
  }).length;

  totalProducts.textContent = productCount;
  totalUnits.textContent = unitCount;
  inventoryValue.textContent = formatCurrency(totalValue);
  lowStockCount.textContent = lowStockProducts;
}

// ========================================
// 11. EDIT PRODUCT
// ========================================

function editProduct(productId) {
  const product = products.find(function (item) {
    return item.id === productId;
  });

  if (!product) {
    return;
  }

  editingProductId = product.id;

  productIdInput.value = product.productId;
  productNameInput.value = product.name;
  productPriceInput.value = product.price;
  productQuantityInput.value = product.quantity;

  formTitle.textContent = "Edit Product";
  submitButton.textContent = "Save Changes";

  cancelEditButton.hidden = false;

  productForm.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

// ========================================
// 12. DELETE PRODUCT
// ========================================

function deleteProduct(productId) {
  const product = products.find(function (item) {
    return item.id === productId;
  });

  if (!product) {
    return;
  }

  const confirmed = confirm(`Are you sure you want to delete ${product.name}?`);

  if (!confirmed) {
    return;
  }

  products = products.filter(function (item) {
    return item.id !== productId;
  });

  // Exit edit mode if the edited product was deleted
  if (editingProductId === productId) {
    resetProductForm();
  }

  saveProducts();
  displayProducts();
  updateSummary();
}

// ========================================
// 13. HANDLE PRODUCT ACTIONS
// ========================================

productList.addEventListener("click", function (event) {
  const target = event.target;

  if (target.classList.contains("edit-button")) {
    const productId = Number(target.dataset.id);

    editProduct(productId);
  }

  if (target.classList.contains("delete-button")) {
    const productId = Number(target.dataset.id);

    deleteProduct(productId);
  }
});

// ========================================
// 14. SEARCH PRODUCTS
// ========================================

searchInput.addEventListener("input", function () {
  displayProducts();
});

// ========================================
// 15. FILTER PRODUCTS
// ========================================

stockFilter.addEventListener("change", function () {
  displayProducts();
});

// ========================================
// 16. CANCEL PRODUCT EDITING
// ========================================

cancelEditButton.addEventListener("click", function () {
  resetProductForm();
});

// ========================================
// 17. DISPLAY INITIAL INVENTORY
// ========================================

displayProducts();
updateSummary();
