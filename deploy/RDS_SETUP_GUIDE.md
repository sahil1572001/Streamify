# 🗄️ AWS RDS PostgreSQL Setup Guide

## Complete guide to create and configure AWS RDS for Streamify

---

## 📋 Overview

AWS RDS (Relational Database Service) provides managed PostgreSQL database with:
- ✅ Automatic backups
- ✅ High availability
- ✅ Automatic software patching
- ✅ Easy scaling
- ✅ Free tier: 750 hours/month of db.t3.micro or db.t4g.micro

---

## 🚀 Step 1: Create RDS Instance

### Via AWS Console

1. **Sign in to AWS Console**
   - Navigate to RDS Dashboard
   - Region: **ap-south-1** (Mumbai)

2. **Create Database**
   - Click **"Create database"**

3. **Choose Database Creation Method**
   - Select: **Standard create**

4. **Engine Options**
   - Engine type: **PostgreSQL**
   - Version: **PostgreSQL 15.x** (latest stable)
   - ✅ Free tier template available

5. **Templates**
   - Select: **Free tier** ✅
   - This automatically selects db.t3.micro or db.t4g.micro

6. **Settings**
   - **DB instance identifier**: `streamify-db`
   - **Master username**: `postgres` (or custom)
   - **Master password**: Create a strong password
   - **Confirm password**: Re-enter password
   - 📝 **Save these credentials securely!**

7. **DB Instance Class**
   - **Instance type**: db.t3.micro or db.t4g.micro
   - ✅ Free tier eligible (750 hours/month)

8. **Storage**
   - **Storage type**: General Purpose SSD (gp3)
   - **Allocated storage**: 20 GB (free tier: up to 20 GB)
   - **Storage autoscaling**: Disable (to stay in free tier)

9. **Connectivity**
   - **Compute resource**: Don't connect to an EC2 compute resource
   - **VPC**: Default VPC
   - **Subnet group**: default
   - **Public access**: **Yes** (for easy access from EC2)
   - **VPC security group**: Create new
     - Name: `streamify-rds-sg`
   - **Availability Zone**: No preference

10. **Database Authentication**
    - Select: **Password authentication**

11. **Additional Configuration**
    - **Initial database name**: `streamify`
    - **Backup retention**: 7 days (free tier)
    - **Enable encryption**: Yes (recommended)
    - **Enable Enhanced monitoring**: No (to save costs)
    - **Enable auto minor version upgrade**: Yes

12. **Create Database**
    - Review settings
    - Click **"Create database"**
    - Wait 5-10 minutes for creation

---

## 🔐 Step 2: Configure Security Group

### Allow EC2 to Connect to RDS

1. **Get EC2 Security Group ID**
   - Go to EC2 Dashboard → Instances
   - Select your Streamify EC2 instance
   - Note the **Security Group ID** (e.g., `sg-0123456789abcdef`)

2. **Configure RDS Security Group**
   - Go to RDS Dashboard → Databases
   - Click on `streamify-db`
   - Click on **VPC security groups** link
   - Click **"Edit inbound rules"**

3. **Add Inbound Rule**
   - Click **"Add rule"**
   - **Type**: PostgreSQL
   - **Protocol**: TCP
   - **Port**: 5432
   - **Source**: Custom
   - **Source value**: Paste EC2 Security Group ID (sg-xxxxx)
   - **Description**: Allow from Streamify EC2
   - Click **"Save rules"**

### Optional: Allow Your Local Machine (for testing)

4. **Add Your IP (Optional)**
   - Click **"Add rule"**
   - **Type**: PostgreSQL
   - **Port**: 5432
   - **Source**: My IP
   - **Description**: Allow from my computer
   - Click **"Save rules"**

---

## 📝 Step 3: Get RDS Connection Details

1. **Go to RDS Dashboard**
   - Click on `streamify-db`

2. **Note Connection Details**
   - **Endpoint**: `streamify-db.xxxxx.ap-south-1.rds.amazonaws.com`
   - **Port**: `5432`
   - **Database name**: `streamify`
   - **Master username**: `postgres` (or what you set)

3. **Save These Details**
   ```
   DATABASE_HOSTNAME=streamify-db.xxxxx.ap-south-1.rds.amazonaws.com
   DATABASE_PORT=5432
   DATABASE_NAME=streamify
   DATABASE_USERNAME=postgres
   DATABASE_PASSWORD=your_master_password
   ```

---

## 🧪 Step 4: Test Connection from EC2

### Connect to Your EC2 Instance

```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

### Install PostgreSQL Client (if not installed)

```bash
sudo apt-get update
sudo apt-get install -y postgresql-client
```

### Test Connection

```bash
psql -h streamify-db.xxxxx.ap-south-1.rds.amazonaws.com \
     -U postgres \
     -d streamify \
     -c "SELECT version();"
```

**Enter password when prompted**

If successful, you'll see PostgreSQL version information.

---

## 🗄️ Step 5: Initialize Database

### Create Database (if not created during RDS setup)

```bash
psql -h YOUR_RDS_ENDPOINT -U postgres -d postgres << EOF
CREATE DATABASE streamify;
EOF
```

### Create Application User (Optional - Better Security)

```bash
psql -h YOUR_RDS_ENDPOINT -U postgres -d streamify << EOF
CREATE USER streamify_app WITH PASSWORD 'your_app_password';
GRANT ALL PRIVILEGES ON DATABASE streamify TO streamify_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO streamify_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO streamify_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO streamify_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO streamify_app;
EOF
```

---

## 🔧 Step 6: Configure Backend .env

Update your backend `.env` file with RDS credentials:

```bash
cd /var/www/streamify/backend
nano .env
```

**Update these lines:**

```bash
DATABASE_HOSTNAME=streamify-db.xxxxx.ap-south-1.rds.amazonaws.com
DATABASE_PORT=5432
DATABASE_NAME=streamify
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_master_password
```

**Save and exit** (Ctrl+X, Y, Enter)

---

## 🌱 Step 7: Run Database Migrations

```bash
cd /var/www/streamify/backend
source venv/bin/activate

# Run migrations (if using Alembic)
alembic upgrade head

# Seed initial data
python -m app.seed_data
```

---

## 💰 Cost Optimization (Free Tier)

### Free Tier Limits (12 months)
- **750 hours/month** of db.t3.micro or db.t4g.micro
- **20 GB** of General Purpose (SSD) storage
- **20 GB** of backup storage
- **Enough for 24/7 operation** of 1 instance

### Tips to Stay in Free Tier
1. ✅ Use only 1 RDS instance
2. ✅ Keep storage under 20 GB
3. ✅ Use db.t3.micro or db.t4g.micro
4. ✅ Disable storage autoscaling
5. ✅ Monitor usage in AWS Billing Dashboard

### After Free Tier (12 months)
- **db.t3.micro**: ~$15-20/month
- **20 GB storage**: ~$2-3/month
- **Total**: ~$17-23/month

---

## 🔒 Security Best Practices

### 1. Strong Password
```bash
# Generate strong password
openssl rand -base64 32
```

### 2. Restrict Security Group
- Only allow EC2 security group
- Remove "My IP" rule in production

### 3. Enable Encryption
- Enable encryption at rest (done during creation)
- Use SSL for connections

### 4. Regular Backups
- Keep automated backups enabled (7 days)
- Create manual snapshots before major changes

### 5. Use IAM Authentication (Advanced)
```bash
# Enable IAM database authentication
aws rds modify-db-instance \
  --db-instance-identifier streamify-db \
  --enable-iam-database-authentication \
  --apply-immediately
```

---

## 📊 Monitoring

### CloudWatch Metrics (Free)
- CPU Utilization
- Database Connections
- Free Storage Space
- Read/Write IOPS

### Enable Performance Insights (Optional - Costs extra)
- Detailed query performance
- Wait event analysis

### Set Up Alarms
```bash
# Example: Alert when storage < 2GB
aws cloudwatch put-metric-alarm \
  --alarm-name streamify-low-storage \
  --alarm-description "RDS storage below 2GB" \
  --metric-name FreeStorageSpace \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 2000000000 \
  --comparison-operator LessThanThreshold \
  --evaluation-periods 1
```

---

## 🔄 Backup & Restore

### Manual Snapshot
1. Go to RDS Dashboard
2. Select `streamify-db`
3. Actions → Take snapshot
4. Name: `streamify-backup-YYYYMMDD`

### Restore from Snapshot
1. Go to RDS Dashboard → Snapshots
2. Select snapshot
3. Actions → Restore snapshot
4. Configure new instance settings

### Export Data (Manual Backup)
```bash
# From EC2 instance
pg_dump -h YOUR_RDS_ENDPOINT \
        -U postgres \
        -d streamify \
        -F c \
        -f streamify_backup_$(date +%Y%m%d).dump
```

### Import Data
```bash
pg_restore -h YOUR_RDS_ENDPOINT \
           -U postgres \
           -d streamify \
           -v streamify_backup_20260214.dump
```

---

## 🐛 Troubleshooting

### Cannot Connect from EC2

**Check Security Group:**
```bash
# Verify RDS security group allows EC2
aws ec2 describe-security-groups \
  --group-ids sg-xxxxx \
  --query 'SecurityGroups[0].IpPermissions'
```

**Check RDS Status:**
```bash
aws rds describe-db-instances \
  --db-instance-identifier streamify-db \
  --query 'DBInstances[0].DBInstanceStatus'
```

### Connection Timeout

1. **Verify Public Accessibility**: RDS → Connectivity → Public accessibility = Yes
2. **Check VPC Settings**: Ensure EC2 and RDS are in same VPC
3. **Verify Endpoint**: Copy exact endpoint from RDS console

### Authentication Failed

1. **Verify Credentials**: Check username and password
2. **Check Database Name**: Ensure database exists
3. **Master User**: Use master username, not IAM user

### Out of Storage

```bash
# Check storage usage
aws rds describe-db-instances \
  --db-instance-identifier streamify-db \
  --query 'DBInstances[0].AllocatedStorage'

# Modify storage (will incur costs if > 20GB)
aws rds modify-db-instance \
  --db-instance-identifier streamify-db \
  --allocated-storage 30 \
  --apply-immediately
```

---

## 🔧 Advanced Configuration

### Enable SSL Connections

**Download RDS Certificate:**
```bash
cd /var/www/streamify/backend
wget https://truststore.pki.rds.amazonaws.com/ap-south-1/ap-south-1-bundle.pem
```

**Update Connection String:**
```python
# In database.py or config
SQLALCHEMY_DATABASE_URL = (
    f"postgresql://{USERNAME}:{PASSWORD}@{HOSTNAME}:{PORT}/{DATABASE}"
    f"?sslmode=require&sslrootcert=ap-south-1-bundle.pem"
)
```

### Connection Pooling

**Update backend configuration:**
```python
# In database.py
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    poolclass=QueuePool,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=3600
)
```

---

## 📋 Quick Reference

### Connection String Format
```
postgresql://username:password@endpoint:5432/database
```

### Common psql Commands
```bash
# Connect
psql -h ENDPOINT -U USERNAME -d DATABASE

# List databases
\l

# List tables
\dt

# Describe table
\d table_name

# Execute SQL file
\i script.sql

# Exit
\q
```

### Environment Variables
```bash
export PGHOST=streamify-db.xxxxx.ap-south-1.rds.amazonaws.com
export PGPORT=5432
export PGDATABASE=streamify
export PGUSER=postgres
export PGPASSWORD=your_password

# Now you can use psql without flags
psql -c "SELECT version();"
```

---

## ✅ Checklist

- [ ] RDS instance created (db.t3.micro)
- [ ] Security group configured
- [ ] EC2 can connect to RDS
- [ ] Database `streamify` created
- [ ] Backend .env updated with RDS credentials
- [ ] Database migrations run successfully
- [ ] Initial data seeded
- [ ] Backups enabled
- [ ] Monitoring set up
- [ ] SSL enabled (optional)

---

## 📞 Support Resources

- **AWS RDS Documentation**: https://docs.aws.amazon.com/rds/
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **AWS Free Tier**: https://aws.amazon.com/free/
- **RDS Pricing**: https://aws.amazon.com/rds/postgresql/pricing/

---

**Created**: February 14, 2026  
**Region**: ap-south-1 (Mumbai)  
**Database**: PostgreSQL 15.x on AWS RDS  
**Instance**: db.t3.micro (Free Tier) ✅
