import { registerUser } from "../Services/authService.js";

/* Signup form submission */
const signupForm = document.querySelector(".form");
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // If the form is already submitting, do nothing
  if (signupForm.hasAttribute("data-submitting")) return;

  signupForm.setAttribute("data-submitting", "true");

  // Clear any previous error messages
  document.querySelector(".form__error-msg").textContent = "";

  const formData = new FormData(signupForm);
  const credentials = Object.fromEntries(formData);

  try {
    const data = await registerUser(credentials);

    localStorage.setItem("user", JSON.stringify(data.user));

    signupForm.removeAttribute("data-submitting");

    if (data.user.role === "admin") {
      window.location.href = "../../Admin/admin.html";
    } else {
      window.location.href = "../../Homepage/homepage.html";
    }
  } catch (err) {
    // UI Error Handling
    document.querySelector(".form__error-msg").textContent = err.message;
    signupForm.removeAttribute("data-submitting");
  }
});

const nameField = document.querySelector(".name");

const lettersAndSpaces = /^[A-Za-z\s]+$/; // only letters/spaces — no digits, symbols, etc.
const properlySpaced = /^[A-Za-z]+(?:\s[A-Za-z]+)*$/; // single spaces between words, no leading/trailing/double

// 1) Anything that isn't a letter or a space
nameField.addEventListener("blur", function (e) {
  const value = e.target.value;
  if (value && !lettersAndSpaces.test(value)) {
    e.target.closest(".form__field").classList.add("name-err");
    e.target.style.border = "1px solid #ff0000";
  } else {
    e.target.closest(".form__field").classList.remove("name-err");
    e.target.style.border = "none";
  }
});

// 2) Letters/spaces are fine, but the spacing itself is malformed
nameField.addEventListener("blur", function (e) {
  const value = e.target.value;
  if (
    value &&
    lettersAndSpaces.test(value) &&
    !properlySpaced.test(value.trim())
  ) {
    e.target.closest(".form__field").classList.add("name-space-err");
    e.target.style.border = "1px solid #ff0000";
  } else {
    e.target.closest(".form__field").classList.remove("name-space-err");
    e.target.style.border = "none";
    e.target.value = value.trim();
  }
});
document.querySelector(".phone").addEventListener("blur", function (e) {
  if (!/^\+?[0-9\s()-]{7,20}$/.test(e.target.value) && e.target.value) {
    console.log("hey");
    e.target.closest(".form__field").classList.add("phone-err");
    e.target.style.border = "1px solid #ff0000";
  } else {
    e.target.closest(".form__field").classList.remove("phone-err");
    e.target.style.border = "none";
  }
});
document.querySelector(".email").addEventListener("blur", function (e) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value) && e.target.value) {
    console.log("hey");
    e.target.closest(".form__field").classList.add("email-err");
    e.target.style.border = "1px solid #ff0000";
  } else {
    e.target.closest(".form__field").classList.remove("email-err");
    e.target.style.border = "none";
  }
});
document.querySelector(".password").addEventListener("blur", function (e) {
  if (!/^.{8,}$/.test(e.target.value) && e.target.value) {
    console.log("hey");
    e.target.closest(".form__field").classList.add("password-err");
    document.querySelector(".form__toggle-password").style.top = "0";
    e.target.style.border = "1px solid #ff0000";
  } else {
    e.target.closest(".form__field").classList.remove("password-err");
    e.target.style.border = "none";
    document.querySelector(".form__toggle-password").style.top = "24px";
  }
});
