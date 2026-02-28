# Highscore Clinical Intelligence Hub

面向 10 个 clinical development 高分项目的行业情报平台。

## 当前能力

- 定期抓取行业信号（申办方/技术平台/vendor/成效/合作/咨询报告/学术案例）
- 重点监控科技巨头：OpenAI、Anthropic、AWS、IBM、Microsoft、Google
- 自动生成每日摘要 `data/daily_digest.json`
- 前端支持中/英/德三语，并展示“今日新增了什么”

## 关键文件

- `data/projects.json`: 10 个项目 + 关键词
- `data/latest_signals.json`: 最新信号数据
- `data/daily_digest.json`: 每日更新摘要（新增、今日发布、科技巨头命中）
- `scripts/fetch_news.py`: 主抓取脚本
- `scripts/daily_update.sh`: 服务器每日更新入口
- `deploy/nginx/highscore.conf`: Nginx 配置
- `deploy/systemd/highscore-update.service`: systemd 更新服务
- `deploy/systemd/highscore-update.timer`: systemd 每日定时器

## 本地运行

1. 抓取数据：

```bash
python3 scripts/fetch_news.py --verbose --timeout 8 --providers google,bing
```

2. 启动静态服务：

```bash
python3 -m http.server 8081
```

3. 打开页面：

- `http://localhost:8081/web/`

## 阿里云部署（Ubuntu + Nginx + systemd）

### 1) 准备目录

```bash
sudo mkdir -p /opt/highscore
sudo chown -R $USER:$USER /opt/highscore
cd /opt/highscore
git clone <你的仓库地址> HighscoreMarketIntelligence
cd HighscoreMarketIntelligence
```

### 2) 安装依赖

```bash
sudo apt update
sudo apt install -y nginx python3
```

### 3) 配置 Nginx

```bash
sudo cp deploy/nginx/highscore.conf /etc/nginx/sites-available/highscore.conf
sudo ln -sf /etc/nginx/sites-available/highscore.conf /etc/nginx/sites-enabled/highscore.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### 4) 配置每日自动更新（每天 06:30）

```bash
sudo cp deploy/systemd/highscore-update.service /etc/systemd/system/
sudo cp deploy/systemd/highscore-update.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now highscore-update.timer
```

检查状态：

```bash
systemctl status highscore-update.timer
systemctl list-timers | grep highscore-update
```

手动触发一次更新：

```bash
sudo systemctl start highscore-update.service
```

查看更新日志：

```bash
tail -f /var/log/highscore_update.log
```

## 数据更新说明

每次运行 `fetch_news.py` 会更新两个文件：

- `data/latest_signals.json`: 最新信号列表
- `data/daily_digest.json`: 每日摘要（包括：
  - `new_since_last_run`
  - `new_published_today`
  - `watchlist.total_hits`
  - `watchlist.new_hit_breakdown`）

前端页面会自动读取这两个文件并展示“今日更新”和“科技巨头动向”。

## 备注

如果服务器网络访问 Google/Bing RSS 受限，会出现抓取失败。建议后续接入你可稳定访问的白名单源或 API（监管机构、期刊、咨询公司、企业新闻中心）。
