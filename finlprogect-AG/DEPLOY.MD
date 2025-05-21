Prompt:

Eres un Senior DevSecOps Engineer y se te ha solicitado implementar un pipeline de CI/CD utilizando GitHub Actions para una aplicación compuesta por frontend y backend Node.js. La estructura del pipeline debe seguir las siguientes especificaciones y buenas prácticas:

CI/CD (GitHub Actions)
Utiliza un archivo .github/workflows/ci-cd.yml con sintaxis YAML para definir el pipeline.

El pipeline debe ejecutarse cuando se cree un pull_request hacia la rama main.

Job build:
Incluye los siguientes pasos:

Checkout del repositorio.

Instalación de dependencias con npm install para:

Backend (en carpeta /backend)

Frontend (en carpeta /frontend)

Ejecución de tests del backend con npm test desde la carpeta backend.

Build de backend y frontend con npm run build.

Ejecución de migraciones Prisma con npx prisma migrate deploy desde la carpeta backend.

Instalación de Docker y Docker Compose.

Levantamiento de servicios de base de datos usando docker-compose up -d.

Arranque del backend (npm start) en el puerto 3001 y del frontend (npm start) en el puerto 3000.

Espera activa para asegurar que la base de datos, frontend y backend estén disponibles (usando nc, curl o similar).

Ejecución de tests E2E con Cypress desde el frontend.

Job deploy:
Este job se debe ejecutar solo si el evento es pull_request y después del build. Incluir los siguientes pasos:

Configuración de credenciales de AWS usando las variables de entorno:

AWS_ACCESS_KEY_ID

AWS_SECRET_ACCESS_KEY

AWS_REGION

Subida del contenido de la carpeta backend a un bucket S3 utilizando el comando aws s3 cp ./backend s3://<nombre-del-bucket> --recursive.

Conexión a una instancia EC2 vía SSH.

Dentro de la EC2:

Descarga del backend desde S3.

Instalación de dependencias con npm install.

Build del backend con npm run build.

Instalación de PM2 globalmente con npm install -g pm2.

Ejecución del backend en segundo plano usando PM2: pm2 start npm --name backend -- start.

Persistencia de procesos PM2 al reiniciar: pm2 save y pm2 startup.

Instalación y configuración de Nginx como proxy inverso:

El backend corre en el puerto 3001

Nginx debe redirigir desde el puerto 80 al backend (por ejemplo, /api → http://localhost:3001).

Validación de la configuración de Nginx con nginx -t y reinicio del servicio.

Requisitos adicionales y buenas prácticas aplicadas:
El backend no debe quedarse ejecutándose indefinidamente en primer plano (usar PM2).

Cypress debe ejecutarse solo cuando los servicios estén listos.

Todos los logs del backend deben ser accesibles vía pm2 logs.

El sistema debe ser resiliente ante caídas del backend (PM2 reinicia en caso de fallo).