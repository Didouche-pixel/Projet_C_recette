// controleur.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import { getAuth, sendPasswordResetEmail, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import { getDatabase, ref, push, get, remove, set, update } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js';

import { View } from './vues.js';

// Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCm-pS4knAMJS3s6GbK8XrRKedskp3aWrQ",
    authDomain: "carnet-de-recettes-a27d1.firebaseapp.com",
    databaseURL: "https://carnet-de-recettes-a27d1-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "carnet-de-recettes-a27d1",
    storageBucket: "carnet-de-recettes-a27d1.firebasestorage.app",
    messagingSenderId: "623328046091",
    appId: "1:623328046091:web:72032be4debf2c4cfc2b0e",
    measurementId: "G-FHM22R4N38"
};

// Initialisation Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

localStorage.setItem('firebase:debug', 'true');


// Contrôleur
export const Controleur = {
    init() {
        this.setupEventListeners();
        this.checkUserStatus();
    },

    setupEventListeners() {

        if (this.listenersInitialized) return;  // Check if listeners are already set
        const dbRef = ref(db, '/'); // Référence à la racine de la base
        get(dbRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    console.log("Connexion Firebase réussie, données existantes :", snapshot.val());
                } else {
                    console.log("Connexion Firebase réussie, aucune donnée existante.");
                }
            })
            .catch((error) => {
                console.error("Erreur de connexion à Firebase :", error);
            });
        // Formulaire d'inscription
        let isProcessing = false; // Verrou global pour éviter la duplication

        // Formulaire d'inscription
        if (document.getElementById("signUpForm")) {
            const signUpForm = document.getElementById("signUpForm");

            // Supprime tous les anciens écouteurs
            const newSignUpForm = removeEventListenersFromElement(signUpForm, "submit");

            newSignUpForm.addEventListener("submit", (e) => {
                e.preventDefault();

                if (isProcessing) return; // Empêche l'exécution multiple
                isProcessing = true;

                const email = document.getElementById("signUpEmail").value;
                const password = document.getElementById("signUpPassword").value;

                // Vérification du mot de passe
                if (password.length < 8) {
                    View.showMessage("error", "Le mot de passe doit contenir au moins 8 caractères.");
                    isProcessing = false; // Réinitialise le verrou
                    return;
                }

                console.log("Tentative d'inscription avec :", email);

                // Vérifie si l'utilisateur existe déjà dans la base de données
                get(ref(db, `utilisateurs`))
                    .then((snapshot) => {
                        if (snapshot.exists()) {
                            const utilisateurs = snapshot.val();
                            for (const userId in utilisateurs) {
                                if (utilisateurs[userId].email === email) {
                                    View.showMessage("error", "Cet utilisateur existe déjà !");
                                    isProcessing = false; // Réinitialise le verrou
                                    return; // Arrête la soumission
                                }
                            }
                        }

                        // Création de l'utilisateur via Firebase Authentication
                        return createUserWithEmailAndPassword(auth, email, password);
                    })
                    .then((userCredential) => {
                        if (!userCredential) return; // Empêche l'exécution si déjà bloqué

                        const user = userCredential.user;
                        console.log("Utilisateur inscrit avec succès :", user.uid);

                        // Enregistrement dans Firebase Database
                        const userData = { email: user.email };
                        console.log("Données utilisateur à insérer :", userData);

                        return set(ref(db, `utilisateurs/${user.uid}`), userData);
                    })
                    .then(() => {
                        console.log("Utilisateur inséré dans la base de données avec succès !");
                        isProcessing = false; // Réinitialise le verrou
                        window.location.href = "recettes.html"; // Redirection
                    })
                    .catch((error) => {
                        console.error("Erreur :", error.message);
                        View.showMessage("error", `Erreur : ${error.message}`);
                        isProcessing = false; // Réinitialise le verrou
                    });
            });
            // Mark listeners as initialized
            this.listenersInitialized = true;
        }

        // Fonction utilitaire pour supprimer les anciens écouteurs
        function removeEventListenersFromElement(element, eventType) {
            const newElement = element.cloneNode(true); // Clone l'élément pour supprimer les anciens écouteurs
            element.parentNode.replaceChild(newElement, element); // Remplace l'ancien par le nouveau
            return newElement; // Retourne l'élément sans écouteurs
        }

        // Formulaire de connexion             
        if (document.getElementById("signInForm")) {
            document.getElementById("signInForm").addEventListener("submit", (e) => {
                e.preventDefault();
                const email = document.getElementById("signInEmail").value;
                const password = document.getElementById("signInPassword").value;

                // Vérification des champs
                if (!email || !password) {
                    View.showMessage("error", "Veuillez remplir tous les champs.");
                    return; // Empêche l'envoi de la requête si les champs sont vides
                }

                console.log("Tentative de connexion avec :", email, password);

                signInWithEmailAndPassword(auth, email, password)
                    .then((userCredential) => {
                        const user = userCredential.user;
                        console.log("Connexion réussie :", user);

                        // Vérifier si l'utilisateur existe déjà dans la base de données
                        const userRef = ref(db, `utilisateurs/${user.uid}`);
                        get(userRef).then((snapshot) => {
                            if (!snapshot.exists()) {
                                set(userRef, {
                                    email: user.email,
                                    lastLoginAt: new Date().toISOString() // Ajoute la date de dernière connexion
                                })
                                    .then(() => console.log("Utilisateur ajouté dans la base de données."))
                                    .catch((error) => console.error("Erreur lors de l'ajout de l'utilisateur :", error.message));
                            } else {
                                console.log("L'utilisateur existe déjà dans la base de données.");
                            }
                        });

                        window.location.href = "recettes.html"; // Redirection
                    })
                    .catch((error) => {
                        console.error("Erreur de connexion :", error.message);
                        View.showMessage("error", `Erreur de connexion : ${error.message}`);
                    });
            });
        }

        // Gestionnaire d'événements pour le lien "Mot de passe oublié ?"
        const forgotPasswordLink = document.getElementById("forgotPasswordLink");

        if (forgotPasswordLink) {
            // Remove any existing event listeners first
            const newForgotPasswordLink = forgotPasswordLink.cloneNode(true);
            forgotPasswordLink.parentNode.replaceChild(newForgotPasswordLink, forgotPasswordLink);

            // Add event listener to the new cloned element
            newForgotPasswordLink.addEventListener("click", (e) => {
                e.preventDefault();  // Empêche l'action par défaut du lien

                const email = document.getElementById("signInEmail").value;

                // Vérifier si l'email est vide
                if (!email) {
                    View.showMessage("error", "Veuillez entrer un email.");
                    return;  // Arrête la fonction si l'email est vide
                }

                // Appeler la méthode Firebase pour envoyer l'email de réinitialisation
                const auth = getAuth();
                sendPasswordResetEmail(auth, email)
                    .then(() => {
                        View.showMessage("success", "Un email de réinitialisation a été envoyé !");
                    })
                    .catch((error) => {
                        console.error("Erreur lors de l'envoi de l'email :", error.message);
                        View.showMessage("error", "Erreur lors de l'envoi de l'email de réinitialisation.");
                    });
            });
        }

        if (document.getElementById("recipe-list")) {
            const user = auth.currentUser;
            if (user) {
                const recipesRef = ref(db, `recettes/${user.uid}`);
                get(recipesRef).then(snapshot => {
                    const recipeList = document.getElementById("recipe-list").getElementsByTagName("tbody")[0];
                    recipeList.innerHTML = ""; // Réinitialise le tableau

                    if (snapshot.exists()) {
                        snapshot.forEach(childSnapshot => {
                            const recipe = childSnapshot.val();

                            // Crée une ligne de tableau pour chaque recette
                            const tr = document.createElement("tr");

                            // Crée les cellules pour chaque champ de la recette
                            const titleCell = document.createElement("td");
                            titleCell.textContent = recipe.title;

                            const ingredientsCell = document.createElement("td");
                            ingredientsCell.textContent = recipe.ingredients.join(", ");

                            const instructionsCell = document.createElement("td");
                            instructionsCell.textContent = recipe.instructions;

                            // Crée la cellule pour les actions (modification et suppression)
                            const actionsCell = document.createElement("td");
                            actionsCell.innerHTML = `
                                <button class="btn btn-warning btn-sm edit-recipe" data-id="${childSnapshot.key}">Modifier</button>
                                <button class="btn btn-danger btn-sm delete-recipe" data-id="${childSnapshot.key}">Supprimer</button>
                            `;

                            // Ajoute les cellules à la ligne
                            tr.appendChild(titleCell);
                            tr.appendChild(ingredientsCell);
                            tr.appendChild(instructionsCell);
                            tr.appendChild(actionsCell);

                            // Ajoute la ligne au tableau
                            recipeList.appendChild(tr);
                        });
                    } else {
                        const tr = document.createElement("tr");
                        const td = document.createElement("td");
                        td.colSpan = 4; // Occupe toute la largeur du tableau
                        td.textContent = "Vous n'avez aucune recette pour le moment.";
                        tr.appendChild(td);
                        recipeList.appendChild(tr);
                    }
                }).catch(error => {
                    console.error("Erreur lors de la récupération des recettes :", error.message);
                });
            }
        }




        // Fonction pour supprimer le compte et les recettes
        const deleteAccountButton = document.getElementById("deleteAccountButton");

        if (deleteAccountButton) {
            deleteAccountButton.addEventListener("click", () => {
                const user = auth.currentUser;
                if (user) {
                    const userId = user.uid;

                    // Supprimer les recettes de l'utilisateur
                    const recipesRef = ref(db, `recettes/${userId}`);
                    remove(recipesRef)
                        .then(() => {
                            console.log("Recettes supprimées de la base de données.");

                            // Supprimer les données de l'utilisateur dans la base de données
                            const userRef = ref(db, `utilisateurs/${userId}`);
                            remove(userRef)
                                .then(() => {
                                    console.log("Données utilisateur supprimées de la base de données.");

                                    // Supprimer le compte de l'utilisateur de Firebase Authentication
                                    user.delete()
                                        .then(() => {
                                            console.log("Compte utilisateur supprimé !");
                                            // Redirige l'utilisateur vers la page de connexion après la suppression
                                            window.location.href = "index.html";
                                        })
                                        .catch((error) => {
                                            console.error("Erreur lors de la suppression du compte :", error.message);
                                            View.showMessage("error", `Erreur lors de la suppression du compte : ${error.message}`);
                                        });
                                })
                                .catch((error) => {
                                    console.error("Erreur lors de la suppression des données utilisateur :", error.message);
                                    View.showMessage("error", `Erreur lors de la suppression des données utilisateur : ${error.message}`);
                                });
                        })
                        .catch((error) => {
                            console.error("Erreur lors de la suppression des recettes :", error.message);
                            View.showMessage("error", `Erreur lors de la suppression des recettes : ${error.message}`);
                        });
                } else {
                    View.showMessage("error", "Utilisateur non authentifié !");
                }
            });
        }




        // Bouton "Ajouter une recette" pour revenir à la page précédente
        if (document.getElementById("addRecipeButton")) {
            document.getElementById("addRecipeButton").addEventListener("click", () => {
                window.location.href = "recettes.html";
            });
        }

        // Bouton "Se déconnecter"
        if (document.getElementById("logoutButton")) {
            document.getElementById("logoutButton").addEventListener("click", () => {
                Controleur.logout();
            });
        }

        // Bouton "Afficher les recettes" pour rediriger vers afficher-recettes.html
        if (document.getElementById("viewRecipesButton")) {
            document.getElementById("viewRecipesButton").addEventListener("click", () => {
                const user = auth.currentUser;
                if (user) {
                    // Stocker l'UID de l'utilisateur dans localStorage pour l'utiliser sur afficher-recettes.html
                    localStorage.setItem("currentUserId", user.uid);
                    window.location.href = "afficher-recettes.html"; // Redirection
                } else {
                    View.showMessage("error", "Utilisateur non authentifié !");
                }
            });
        }

        // Ajout de recette (assurez-vous qu'il n'y a pas de duplication ici)
        if (document.getElementById("addRecipeButton")) {
            document.getElementById("addRecipeButton").addEventListener("click", (e) => {
                e.preventDefault();
                const title = document.getElementById("title").value.trim();
                const ingredients = document.getElementById("ingredients").value.trim().split(",");
                const instructions = document.getElementById("instructions").value.trim();

                if (!title || ingredients.length === 0 || !instructions) {
                    View.showMessage("error", "Tous les champs sont obligatoires !");
                    return;
                }

                const user = auth.currentUser;
                if (user) {
                    push(ref(db, `recettes/${user.uid}`), {
                        title,
                        ingredients,
                        instructions
                    })
                        .then(() => {
                            View.showMessage("success", "Recette ajoutée avec succès !");
                            Controleur.refreshRecipes(user.uid);
                        })
                        .catch(error => View.showMessage("error", `Erreur lors de l'ajout de la recette : ${error.message}`));
                } else {
                    View.showMessage("error", "Utilisateur non authentifié !");
                }
            });
        }



        if (document.getElementById("logoutButton")) {
            document.getElementById("logoutButton").addEventListener("click", () => {
                console.log("Bouton déconnexion cliqué !");
                Controleur.logout();
                window.location.href = "index.html";
            });
        }
        // Charger les recettes sur afficher-recettes.html
        if (window.location.pathname.includes("afficher-recettes.html")) {
            this.loadRecipesForCurrentUser();
        }
    },

    deleteAccount() {
        const user = getAuth().currentUser;

        if (user) {
            // 1. Supprimer les données de l'utilisateur dans la base de données Firebase
            const userId = user.uid;

            const userRef = ref(getDatabase(), `utilisateurs/${userId}`);
            const recipesRef = ref(getDatabase(), `recettes/${userId}`);

            // Supprimer les données de l'utilisateur et ses recettes
            Promise.all([
                remove(userRef),  // Supprimer les données utilisateur de 'utilisateurs'
                remove(recipesRef) // Supprimer les recettes de 'recettes'
            ])
                .then(() => {
                    console.log("Utilisateur et recettes supprimés de la base de données.");

                    // 2. Supprimer l'utilisateur de Firebase Authentication
                    deleteUser(user)
                        .then(() => {
                            console.log("Compte utilisateur supprimé de Firebase Authentication.");
                            View.showMessage("success", "Votre compte et vos recettes ont été supprimés.");
                            window.location.href = "index.html";  // Rediriger vers la page de connexion
                        })
                        .catch((error) => {
                            console.error("Erreur lors de la suppression du compte utilisateur :", error.message);
                            View.showMessage("error", "Erreur lors de la suppression de votre compte.");
                        });
                })
                .catch((error) => {
                    console.error("Erreur lors de la suppression des données utilisateur :", error.message);
                    View.showMessage("error", "Erreur lors de la suppression des données utilisateur.");
                });
        } else {
            console.log("Aucun utilisateur connecté.");
            View.showMessage("error", "Vous devez être connecté pour supprimer votre compte.");
        }
    },
    editRecipe(userId, recipeId) {
        const recipeRef = ref(db, `recettes/${userId}/${recipeId}`);
        get(recipeRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const recipe = snapshot.val();
                    const recipeListItem = document.querySelector(`[data-id="${recipeId}"]`).parentElement;

                    // Crée un formulaire de modification
                    recipeListItem.innerHTML = `
                        <form id="editForm">
                            <label for="editTitle">Titre :</label>
                            <input type="text" id="editTitle" value="${recipe.title}" required><br>
    
                            <label for="editIngredients">Ingrédients :</label>
                            <input type="text" id="editIngredients" value="${recipe.ingredients.join(", ")}" required><br>
    
                            <label for="editInstructions">Instructions :</label>
                            <textarea id="editInstructions" required>${recipe.instructions}</textarea><br>
    
                            <button type="submit" id="saveEditButton">Enregistrer</button>
                            <button type="button" id="cancelEditButton">Annuler</button>
                        </form>
                    `;

                    // Ajouter l'événement de soumission sur le formulaire
                    const editForm = document.getElementById("editForm");

                    editForm.addEventListener("submit", (e) => {
                        e.preventDefault();

                        // Récupérer les nouvelles données
                        const updatedTitle = document.getElementById("editTitle").value.trim();
                        const updatedIngredients = document.getElementById("editIngredients").value.trim().split(",");
                        const updatedInstructions = document.getElementById("editInstructions").value.trim();

                        // Préparer les données mises à jour
                        const updatedData = {
                            title: updatedTitle,
                            ingredients: updatedIngredients,
                            instructions: updatedInstructions,
                        };

                        // Mise à jour dans Firebase
                        Controleur.updateRecipe(userId, recipeId, updatedData)
                            .then(() => {
                                console.log("Recette mise à jour avec succès !");
                                View.showMessage("success", "Recette mise à jour avec succès !");
                                Controleur.loadRecipesForCurrentUser(); // Recharge les recettes
                            })
                            .catch((error) => {
                                console.error("Erreur lors de la mise à jour de la recette :", error.message);
                                View.showMessage("error", "Erreur lors de la mise à jour de la recette.");
                            });
                    });

                    // Annuler la modification et recharger les recettes sans modification
                    document.getElementById("cancelEditButton").addEventListener("click", () => {
                        Controleur.loadRecipesForCurrentUser(); // Recharge les recettes sans modification
                    });
                } else {
                    console.error("Recette introuvable !");
                }
            })
            .catch((error) => {
                console.error("Erreur lors de la récupération de la recette :", error.message);
            });
    },

    // Mettre à jour la recette dans Firebase
    updateRecipe(userId, recipeId, updatedData) {
        const recipeRef = ref(db, `recettes/${userId}/${recipeId}`);
        return update(recipeRef, updatedData);
    },

    // Recharger les recettes après modification ou suppression
    loadRecipesForCurrentUser() {
        const userId = localStorage.getItem("currentUserId");
        if (!userId) {
            console.error("Utilisateur non trouvé !");
            window.location.href = "index.html";
            return;
        }

        const recipesRef = ref(db, `recettes/${userId}`);
        get(recipesRef)
            .then((snapshot) => {
                const recipeTableBody = document.querySelector("#recipe-list tbody");
                recipeTableBody.innerHTML = ""; // Réinitialise la liste du tableau

                if (snapshot.exists()) {
                    snapshot.forEach((childSnapshot) => {
                        const recipe = childSnapshot.val();
                        const recipeId = childSnapshot.key;

                        // Crée une ligne de tableau avec les données de la recette
                        const tr = document.createElement("tr");
                        tr.innerHTML = `
                            <td>${recipe.title}</td>
                            <td>${recipe.ingredients.join(", ")}</td>
                            <td>${recipe.instructions}</td>
                            <td>
                                <button class="btn btn-sm btn-primary edit-recipe" data-id="${recipeId}">Modifier</button>
                                <button class="btn btn-sm btn-danger delete-recipe" data-id="${recipeId}">Supprimer</button>
                            </td>
                        `;
                        recipeTableBody.appendChild(tr);
                    });

                    // Ajouter des événements aux boutons Modifier et Supprimer
                    document.querySelectorAll(".delete-recipe").forEach((button) => {
                        button.addEventListener("click", (e) => {
                            const recipeId = e.target.dataset.id;
                            Controleur.deleteRecipe(userId, recipeId);
                        });
                    });

                    document.querySelectorAll(".edit-recipe").forEach((button) => {
                        button.addEventListener("click", (e) => {
                            const recipeId = e.target.dataset.id;
                            Controleur.editRecipe(userId, recipeId);
                        });
                    });
                } else {
                    // Si aucune recette n'est trouvée, afficher une ligne vide
                    recipeTableBody.innerHTML = `
                        <tr>
                            <td colspan="4" class="text-center">Aucune recette trouvée.</td>
                        </tr>
                    `;
                }
            })
            .catch((error) => console.error("Erreur lors de la récupération des recettes :", error.message));
    },

    deleteRecipe(userId, recipeId) {
        const recipeRef = ref(db, `recettes/${userId}/${recipeId}`);
        remove(recipeRef)
            .then(() => {
                console.log(`Recette ${recipeId} supprimée avec succès !`);
                this.loadRecipesForCurrentUser(); // Recharge les recettes après suppression
            })
            .catch((error) => {
                console.error(`Erreur lors de la suppression de la recette ${recipeId} :`, error.message);
                View.showMessage("error", `Erreur lors de la suppression : ${error.message}`);
            });
    },




    checkUserStatus() {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                if (window.location.pathname === "/index.html") {
                    window.location.href = "recettes.html"; // Redirige si connecté
                }
            } else {
                if (window.location.pathname === "/recettes.html") {
                    window.location.href = "index.html"; // Redirige si déconnecté
                }
            }
        });
    },

    addRecipe(userId, recipe) {
        const recipeRef = ref(db, `recettes/${userId}`);
        return push(recipeRef, recipe);
    },

    refreshRecipes(userId) {
        const recipesRef = ref(db, `recettes/${userId}`);
        get(recipesRef).then(snapshot => {
            if (snapshot.exists()) {
                const recipes = [];
                snapshot.forEach(childSnapshot => {
                    recipes.push({ id: childSnapshot.key, ...childSnapshot.val() });
                });
                View.displayRecipes(recipes);
            } else {
                View.showMessage("info", "Vous n'avez aucune recette pour le moment.");
                View.displayRecipes([]);
            }
        }).catch(error => View.showMessage("error", `Erreur lors de la récupération des recettes : ${error.message}`));
    },

    logout() {
        signOut(auth).then(() => {
            View.showMessage("success", "Déconnexion réussie !");
        }).catch(error => View.showMessage("error", `Erreur lors de la déconnexion : ${error.message}`));
    }


};
document.addEventListener("DOMContentLoaded", () => Controleur.init());


// Vérifie si l'utilisateur est authentifié pour accéder à une page sécurisée
export function secureAfficherRecettesPage() {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            // Redirige vers la page de connexion si l'utilisateur n'est pas connecté
            console.warn("Utilisateur non authentifié, redirection vers la page de connexion.");
            window.location.href = "index.html";
        }
    });
}


/*{
  "rules": {
    "utilisateurs": {
      "$user_id": {
        ".read": "auth != null && auth.uid === $user_id",
        ".write": "auth != null && auth.uid === $user_id"
      }
    },
    "recettes": {
      "$user_id": {
        ".read": "auth != null && auth.uid === $user_id",
        ".write": "auth != null && auth.uid === $user_id",
        "$recipe_id": {
          ".validate": "newData.child('title').isString() && newData.child('ingredients').val() != null && newData.child('ingredients').val().length > 0 && newData.child('steps').isString()"
        }
      }
    }
  }
}
 */