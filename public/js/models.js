//models.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import { getDatabase, ref, set, get, push, update, remove } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js';

// Configuration de Firebase
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

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);  // Garder cette ligne
const database = getDatabase(app);  // Utiliser l'app pour accéder à la base de données
const auth = getAuth(app);  // Utiliser l'app pour accéder à Firebase Auth

// Modèle de gestion des recettes et de l'authentification
const Model = {
    // Authentification
    signUp(email, password) {
        return createUserWithEmailAndPassword(auth, email, password);
    },
    signIn(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    },
    signOut() {
        return signOut(auth);
    },

    // Gestion des recettes
    addRecipe(userId, recipe) {
        const recipeRef = ref(database, 'recettes/' + userId);
        const newRecipeRef = push(recipeRef);  // Crée une nouvelle recette
        return set(newRecipeRef, recipe);
    },
    getRecipes(userId) {
        const recipesRef = ref(database, 'recettes/' + userId);
        return get(recipesRef);
    },
    updateRecipe(userId, recipeId, updatedData) {
        const recipeRef = ref(database, 'recettes/' + userId + '/' + recipeId);
        return update(recipeRef, updatedData);
    },    
    deleteRecipe(userId, recipeId) {
        const recipeRef = ref(database, 'recettes/' + userId + '/' + recipeId);
        return remove(recipeRef);
    }
};

// Test de connexion à Firebase
const testFirebaseConnection = () => {
    const dbRef = ref(database, '/'); // Référence à la racine de la base de données
    get(dbRef).then((snapshot) => {
        if (snapshot.exists()) {
            console.log("Connexion réussie à Firebase ! Données :", snapshot.val());
        } else {
            console.log("Aucune donnée disponible");
        }
    }).catch((error) => {
        console.error("Erreur de connexion à Firebase :", error);
    });
};

// Surveille l'état d'authentification de l'utilisateur
onAuthStateChanged(auth, (user) => {
    if (user) {
        // L'utilisateur est authentifié
        console.log('Utilisateur authentifié:', user);
        // Effectuer des actions avec Firebase ici, comme ajouter une recette
        testFirebaseConnection();  // Exemple pour tester la connexion
    } else {
        // L'utilisateur n'est pas authentifié
        console.log('Utilisateur non authentifié');
        // Gérer le cas où l'utilisateur n'est pas authentifié (rediriger, afficher un message, etc.)
    }
});

// Appel du test de connexion à Firebase
testFirebaseConnection();

export { Model }; // Exporter le modèle pour utilisation dans d'autres fichiers
