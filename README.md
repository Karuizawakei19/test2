# 1. Clone the repo 
```
git clone https://github.com/Karuizawakei19/RescueBite.git
cd RescueBite
```

# 2. Switch to assigned branch 
```
git checkout feature/auth          # ← gian/adam
git checkout feature/listings-api #  ← gian/adam
git checkout feature/frontend #   ← kyzen
git checkout feature/database  #  ← azi
```

# 3.  pull latest changes from dev (everyday)
```
git pull origin dev
```

# 4. After coding (save and push  work)
```
git add .
git commit -m "feat: description of the code"
git push origin feature/auth       # ← push to your branch
```

# 5. For Pull Request:
#    --base: dev  ←  compare: feature/your-branch
