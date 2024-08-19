// ! filter gallery



const filterItem = document.querySelector(".items");
const filterImg = document.querySelectorAll(".gallery, .image");


filterItem.onclick = (selectedItem) => {
  if (selectedItem.target.classList.contains("item")) {
    filterItem.querySelector(".active").classList.remove("active");
    selectedItem.target.classList.add("active");
    let filterName = selectedItem.target.getAttribute("data-name");
    filterImg.forEach((image) => {
      let filterImages = image.getAttribute("data-name");
      if ((filterImages == filterName) || (filterName == "all")) {
        image.classList.remove("hide");
        image.classList.add("show");
      } else {
        image.classList.add("hide");
        image.classList.remove("show");
      }
    });
  }
}
for (let i = 0; i < filterImg.length; i++) {
  filterImg[i].setAttribute("onclick", "preview(this)");
}


document.addEventListener("DOMContentLoaded", () => {
  // Ensure the elements exist before using them
  const previewBox = document.querySelector(".preview-box");
  if (!previewBox) {
    console.error("Element with class 'preview-box' not found.");
    return;
  }

  const categoryName = previewBox.querySelector(".title p");
  const previewImg = previewBox.querySelector("img");
  const closeIcon = previewBox.querySelector(".icon");
  const shadow = document.querySelector(".shadow");

  // Ensure all required elements are found
  if (!categoryName || !previewImg || !closeIcon || !shadow) {
    console.error("One or more required elements are missing.");
    return;
  }

  // Function to preview the image
  function preview(element) {
    const selectedPrevImg = element.querySelector("img").src;
    const selectedLink = element.querySelector(".img-link") ? element.querySelector(".img-link").href : '#'; // Fallback if .img-link is not found
    const selectedImgCategory = element.getAttribute("data-name");

    if (previewImg) {
      previewImg.src = selectedPrevImg;
    } else {
      console.error("Preview image element not found.");
    }

    if (categoryName) {
      categoryName.textContent = selectedImgCategory;
    } else {
      console.error("Category name element not found.");
    }

    const link = previewBox.querySelector(".link"); // Use link within the scope of the previewBox
    if (link) {
      link.href = selectedLink;
    } else {
      console.error("Link element inside preview box not found.");
    }

    // Check that previewBox and shadow exist before adding classes
    if (previewBox && shadow) {
      previewBox.classList.add("show");
      shadow.classList.add("show");
    } else {
      console.error("Preview box or shadow element not found.");
    }

    // Handle potential issues with body style
    try {
      document.body.style.overflow = "hidden";
    } catch (error) {
      console.error("Error setting body overflow style:", error);
    }
  }

  // Function to close the preview
  function closePreview() {
    if (previewBox && shadow) {
      previewBox.classList.remove("show");
      shadow.classList.remove("show");
    }

    // Handle potential issues with body style
    try {
      document.body.style.overflow = "auto";
    } catch (error) {
      console.error("Error resetting body overflow style:", error);
    }
  }

  // Add click event listeners to gallery items
  const imageItems = document.querySelectorAll(".image");
  if (imageItems.length === 0) {
    console.warn("No gallery items found.");
  }
  imageItems.forEach(item => {
    item.addEventListener("click", () => preview(item));
  });

  // Close preview when clicking close icon or shadow
  if (closeIcon) {
    closeIcon.addEventListener("click", closePreview);
  }

  if (shadow) {
    shadow.addEventListener("click", closePreview);
  }
});








