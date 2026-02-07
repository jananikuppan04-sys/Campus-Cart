const Auth = {
    isLoggedIn() {
        return !!localStorage.getItem('token');
    },

    getToken() {
        return localStorage.getItem('token');
    },

    getUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    login(token, user) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    },

    checkAuth(redirect = true) {
        if (!this.isLoggedIn() && redirect) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },

    updateUI() {
        const userIcon = document.getElementById('user-icon');
        if (userIcon) {
            if (this.isLoggedIn()) {
                userIcon.href = 'dashboard.html';
                // userIcon.innerHTML = `<img src="https://ui-avatars.com/api/?name=${this.getUser().name}" style="width:24px;border-radius:50%">`;
            } else {
                userIcon.href = 'login.html';
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Auth.updateUI();
});
