# AdsNetwork

AdsNetwork is a full-stack advertising platform featuring a **Ballerina backend** and a **React frontend**.
It provides a secure, scalable, and developer-friendly environment for managing ads, users, and analytics.

---

## 📌 Features

* **Ballerina Backend**

  * RESTful API design
  * PostgreSQL database support
  * JWT-based authentication
  * Configurable via `Config.toml` or environment variables

* **React Frontend**

  * Modern UI with Tailwind CSS
  * Responsive design for desktop and mobile
  * Environment-specific API endpoint configuration
  * Appwrite used for image storage

---

### **Backend Configuration**

#### 1. Config.toml (Required)

Create `backend/Config.toml`:

```toml
# Database Configuration
dbHost = "<your-db-host>"
dbPort = 5432
dbName = "<your-db-name>"
dbUser = "<your-db-user>"
dbPassword = "<your-db-password>"

# Server Configuration
serverHost = "localhost"
serverPort = 8080

# JWT Configuration
jwtSecret = "<your-jwt-secret>"
jwtExpiryTime = 86400.0 # 24 hours in seconds
```

### **Run the Backend**

```sh
cd backend
bal run
```

---

### **Frontend Configuration**

#### `.env`


Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8080
VITE_APPWRITE_PROJECT_ID="<your-appwrite-project-id>"
VITE_APPWRITE_PROJECT_NAME="<your-appwrite-project-name>"
VITE_APPWRITE_ENDPOINT="<your-appwrite-endpoint>"
VITE_APPWRITE_STORAGE_BUCKET_ID="<your-appwrite-storage-bucket-id>"
```

> ⚠ Keep sensitive data out of version control.

### **Install Dependencies**

```sh
cd frontend
pnpm install
```

### **Run the Frontend**

```sh
pnpm dev
```

---

## Notes

* Both backend and frontend must be running for full functionality.
* Update `.env` and `Config.toml` with your actual configuration before running.


## Contributing

Pull requests are welcome!
Please open an issue for major changes or feature requests.


## License

This project is open source and available under the [MIT License](LICENSE).
