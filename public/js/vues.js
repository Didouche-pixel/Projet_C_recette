// view.js


const View = {
    showMessage(type, message) {
        const messageContainer = document.getElementById('message-container');
        if (!messageContainer) {
            console.error("Element 'message-container' introuvable !");
            return;
        }

        const messageElement = document.createElement('div');
        messageElement.classList.add(type === 'success' ? 'success' : 'error');
        messageElement.textContent = message;

        messageContainer.appendChild(messageElement);

        // Optionnel: Pour supprimer le message après quelques secondes
        setTimeout(() => messageElement.remove(), 3000);
    },

    displayRecipes(recipes) {
        const recipeList = document.getElementById('recipe-list');
        if (!recipeList) {
            console.error("Element 'recipe-list' introuvable !");
            return;
        }

        recipeList.innerHTML = '';  // Vider la liste avant de la remplir

        recipes.forEach(recipe => {
            const recipeItem = document.createElement('li');
            recipeItem.textContent = `${recipe.title} - ${recipe.ingredients.join(', ')}`;
            recipeList.appendChild(recipeItem);
        });
    }
};


export { View };