# backend

## setup

Copy wrangler.sample.toml to wrangler.toml

Update the following values in wrangler.toml
- compatibility_date
- REMOTE_ORIGIN
- JWT_SECRET

Create a new D1 database
```bash
wrangler d1 create {database_name}
```

Create a new R2 bucket
```bash
wrangler r2 bucket create {bucket_name}
```

