document
  .getElementById("add-product-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("name").value;
    const price = document.getElementById("price").value;
    const description = document.getElementById("description").value;

    const productData = {
      name,
      price,
      description,
    };

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      const result = await response.json();

      if (response.ok) {
        alert("Product added successfully!");
        document.getElementById("add-product-form").reset(); // Reset form
      } else {
        alert("Failed to add product: " + result.message);
      }
    } catch (error) {
      alert("Error: " + error.message);
    }
  });
