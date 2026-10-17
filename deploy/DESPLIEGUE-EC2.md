# Despliegue del front en la EC2

Requisitos: Docker y Compose instalados, disco >= 8 GB, puerto 8080 **cerrado** en el security group
(solo lo usa el nginx del host por 127.0.0.1).

## 1. En tu PC (desde la carpeta del front)
```cmd
docker compose build
docker save -o front.tar vidasalud/frontend:local
scp -i "%USERPROFILE%\.ssh\vidasalud-front-2026.pem" front.tar docker-compose.yml ec2-user@44.196.114.181:~/
```

## 2. En la EC2
```bash
docker load -i front.tar
FRONT_BIND=127.0.0.1:8080 docker compose up -d --no-build
curl -I http://127.0.0.1:8080/citas     # debe responder 200
```

## 3. Cambiar el nginx del host (ver deploy/nginx-host-location.txt)
```bash
sudo cp /etc/nginx/conf.d/<archivo>.conf ~/nginx-backup.conf   # respaldo
sudo nano /etc/nginx/conf.d/<archivo>.conf                     # editar el location /
sudo nginx -t && sudo systemctl reload nginx
curl -I https://44.196.114.181.sslip.io/citas                  # 200
```
Si algo falla: restaurar el respaldo y `sudo systemctl reload nginx`.
