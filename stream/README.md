# MomflixStream

## Estrutura
```
momflixStream/
├── config/          # Configurações (NÃO EXPOR)
│   └── database.php
└── public/          # Pasta pública (apontar servidor aqui)
    ├── stream.php
    ├── .htaccess
    └── index.php
```

## Configuração

1. Edite `config/database.php` com suas credenciais
2. Configure servidor web para apontar para a pasta `public/`
3. Abra porta no roteador e anote IP público

## Uso

**Local:** `http://localhost/public/stream.php?id=1`
**Remoto:** Use `video_proxy.php` no servidor online apontando para seu IP
