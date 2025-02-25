import { sql } from "../config/db.js";

export const getAllProducts = async (req, res) => {
  try {
    const products = await sql`
    SELECT * FROM products ORDER BY created_at DESC`;

    console.log("fetched products", products);
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.log("Error on getting products : ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
export const getProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await sql`SELECT * FROM products WHERE id=${id}`;
    res.status(200).json({ success: true, data: product[0] });
  } catch (error) {
    console.log("Error on getting products");
    res.status(500).json({ success: false, message: error.message });
  }
};
export const createProduct = async (req, res) => {
  const { name, price, image } = req.body;
  if (!name || !price || !image) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }
  try {
    const newProduct = await sql`
    INSERT INTO products (name,price,image)
    VALUES(${name},${price},${image})
    RETURNING *
    `;

    res.status(201).json({ success: true, data: newProduct });
  } catch (error) {
    console.log("Error on creating product : ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, price, image } = req.body;

  try {
    const updateProduct = await sql`
    UPDATE products
    SET name=${name}, price=${price}, image=${image} WHERE id=${id}
    RETURNING *`;

    if (updateProduct.length === 0) {
      res.status(404).json({ success: false, message: "Product Not Found." });
    }

    res.status(200).json({ success: true, data: updateProduct[0] });
  } catch (error) {
    console.log("Error on updating product : ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedProduct =
      await sql`DELETE FROM products WHERE id=${id} RETURNING *`;
    if (deletedProduct === 0) {
      res.status(404).json({ success: false, message: "Product Not Found." });
    }
    res
      .status(200)
      .json({ success: true, message: "Product Deleted Successfully." });
  } catch (error) {
    console.log("Error on deleting product : ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
