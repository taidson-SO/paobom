#!/usr/bin/env bash

set -euo pipefail

if [ "${EUID}" -ne 0 ]; then
  echo "Execute o bootstrap como root ou via sudo." >&2
  exit 1
fi

DEPLOY_USER="${DEPLOY_USER:-paobom-deploy}"
DEPLOY_PATH="${DEPLOY_PATH:-/opt/paobom}"
SSH_PORT="${SSH_PORT:-22}"

if [[ ! "$DEPLOY_USER" =~ ^[a-z_][a-z0-9_-]*$ ]]; then
  echo "DEPLOY_USER invalido." >&2
  exit 1
fi

if [[ ! "$DEPLOY_PATH" =~ ^/opt/[a-zA-Z0-9._/-]+$ ]]; then
  echo "DEPLOY_PATH deve estar abaixo de /opt." >&2
  exit 1
fi

if [ -z "${DEPLOY_PUBLIC_KEY_B64:-}" ]; then
  echo "DEPLOY_PUBLIC_KEY_B64 deve ser informado." >&2
  exit 1
fi

# shellcheck disable=SC1091
source /etc/os-release

case "${ID}" in
  ubuntu|debian) ;;
  *)
    echo "Distribuicao nao suportada: ${ID}. Use Ubuntu ou Debian." >&2
    exit 1
    ;;
esac

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y \
  ca-certificates \
  curl \
  fail2ban \
  gnupg \
  openssh-server \
  unattended-upgrades \
  ufw

install -m 0755 -d /etc/apt/keyrings
curl -fsSL "https://download.docker.com/linux/${ID}/gpg" \
  -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

cat > /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/${ID}
Suites: ${UBUNTU_CODENAME:-$VERSION_CODENAME}
Components: stable
Signed-By: /etc/apt/keyrings/docker.asc
EOF

apt-get update
apt-get install -y \
  containerd.io \
  docker-buildx-plugin \
  docker-ce \
  docker-ce-cli \
  docker-compose-plugin

if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  useradd --create-home --shell /bin/bash "$DEPLOY_USER"
fi

usermod -aG docker "$DEPLOY_USER"
install -d -m 0700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" \
  "/home/$DEPLOY_USER/.ssh"
printf '%s' "$DEPLOY_PUBLIC_KEY_B64" | base64 -d \
  > "/home/$DEPLOY_USER/.ssh/authorized_keys"
chown "$DEPLOY_USER:$DEPLOY_USER" \
  "/home/$DEPLOY_USER/.ssh/authorized_keys"
chmod 0600 "/home/$DEPLOY_USER/.ssh/authorized_keys"

install -d -m 0750 -o "$DEPLOY_USER" -g "$DEPLOY_USER" \
  "$DEPLOY_PATH" "$DEPLOY_PATH/releases"

cat > /etc/fail2ban/jail.d/paobom-sshd.conf <<EOF
[sshd]
enabled = true
port = ${SSH_PORT}
maxretry = 5
bantime = 1h
findtime = 10m
EOF

install -d -m 0755 /etc/ssh/sshd_config.d
cat > /etc/ssh/sshd_config.d/60-paobom-hardening.conf <<EOF
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
PubkeyAuthentication yes
MaxAuthTries 3
X11Forwarding no
EOF

sshd -t
systemctl reload ssh
systemctl enable --now docker fail2ban

ufw default deny incoming
ufw default allow outgoing
ufw allow "${SSH_PORT}/tcp"
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable

docker version
docker compose version

echo "Bootstrap concluido para ${DEPLOY_USER} em ${DEPLOY_PATH}."
