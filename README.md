# wy-shortlink — 短链服务

高性能短链接服务，支持短链生成、302 重定向、访问统计（PV/UV）与管理后台。

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 后端框架 | Spring Boot | 3.2.1 |
| JDK | Java | 17 |
| ORM | MyBatis-Plus | 3.5.5 |
| 数据库 | MySQL | 8.0 |
| 缓存 | Redis | 7.x |
| 安全 | Spring Security + JWT (jjwt) | 0.12.3 |
| 前端框架 | React + TypeScript | 19 / ~6.0 |
| UI 组件库 | Ant Design | 6.x |
| 图表 | Recharts | 3.x |
| 构建工具 | Vite | 8.x |
| 包管理 | Maven (后端) / npm (前端) | — |

## 项目结构

```
wy-shortlink/
├── wy-shortlink-common/         # 公共模块：工具类、枚举、异常、统一返回体
├── wy-shortlink-dao/            # 数据访问层：MyBatis-Plus 实体、Mapper、XML
├── wy-shortlink-service/        # 业务逻辑层：Service 接口与实现、DTO/VO
├── wy-shortlink-controller/     # 控制层：Spring Boot 入口、REST API、安全配置
└── wy-shortlink-admin-web/      # 管理后台前端：React + Ant Design
```

模块依赖：`controller → service → dao → common`

## 快速开始

### 环境要求

- JDK 17+
- Maven 3.8+
- MySQL 8.0
- Redis 7.x
- Node.js 18+

### 1. 初始化数据库

```bash
mysql -u root -p < wy-shortlink-controller/src/main/resources/db/init.sql
```

该脚本会创建 `wy_shortlink` 库及全部表结构，并插入默认管理员账号（`admin` / `admin`）。

### 2. 启动后端

```bash
mvn clean package && java -jar wy-shortlink-controller/target/wy-shortlink-controller-1.0.0-SNAPSHOT.jar
```

后端运行在 `http://localhost:8080`。

### 3. 启动前端

```bash
cd wy-shortlink-admin-web
npm install
npm run dev
```

前端运行在 `http://localhost:3000`，已配置代理将 `/api` 和 `/s` 请求转发到后端。

## 核心功能

### 短链生成
- **随机 6 位短码**：基于 Base62 字符集（0-9a-zA-Z）随机生成，62⁶ ≈ 568 亿种组合
- **自定义别名**：支持 6-20 位字母数字别名
- **碰撞处理**：数据库唯一索引兜底，自动重试最多 10 次

### 访问重定向
- **Cache-Aside 模式**：优先查 Redis，未命中回源 MySQL 并回填缓存
- **302 临时重定向**：保留原始 URL 的 SEO 权重

### 访问统计
- **三层架构**：Redis 实时计数 → MySQL 定时同步（5 分钟） → 原始日志离线校对
- **PV**：Redis INCR 原子递增
- **UV**：Redis HyperLogLog 去重统计
- **每日明细**：按日期维度聚合，支持折线图展示

### 用户认证
- **JWT 双令牌**：Access Token（30 分钟）+ Refresh Token（7 天）
- **Redis 黑名单**：登出时将令牌加入黑名单，支持主动失效
- **RBAC**：管理员（admin）与普通用户（user），仅管理员可创建用户

## API 一览

所有接口统一返回格式：`{ code: 0, message: "success", data: {...} }`，`code === 0` 表示成功。

### 公开接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/s/{shortCode}` | 短链跳转（302 重定向） |
| POST | `/api/v1/auth/login` | 用户登录 |
| POST | `/api/v1/auth/refresh` | 刷新令牌 |

### 认证接口（需 Bearer Token）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/auth/logout` | 退出登录 |
| POST | `/api/v1/short-links` | 创建短链 |
| GET | `/api/v1/short-links` | 短链列表（分页） |
| GET | `/api/v1/short-links/{code}` | 短链详情 |
| PUT | `/api/v1/short-links/{code}` | 更新短链 |
| DELETE | `/api/v1/short-links/{code}` | 删除短链 |
| GET | `/api/v1/short-links/{code}/stats` | 访问统计 |

### 管理员接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/users` | 用户列表 |
| POST | `/api/v1/users` | 创建用户 |

## 数据库表

| 表名 | 说明 | 关键索引 |
|------|------|----------|
| `t_short_link` | 短链映射 | `uk_short_code`（唯一） |
| `t_access_log_yyyyMM` | 访问日志（按月分表） | `idx_short_access` |
| `t_access_stats` | 每日聚合统计 | `uk_code_date`（短码+日期唯一） |
| `t_user` | 用户表 | `uk_username`（唯一），密码 BCrypt 加密 |

## 管理后台

访问 `http://localhost:3000`，使用 `admin` / `admin` 登录。

- **短链管理**：创建、编辑、删除、搜索、复制短链，KPI 统计卡片
- **访问统计**：按日期范围查看 PV/UV 趋势折线图
- **用户管理**：仅管理员可见，创建用户

设计风格：数据密集仪表盘（Data-Dense Dashboard），基于 Ant Design 6 深度定制主题。
