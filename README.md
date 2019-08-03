# download_usgs

## utils 是工具文件夹

- mysql （mysql.config.json 是公用的）

### SENTINEL-2A 哨兵 2A 数据爬取

- config.json

```javascript
{
  "lastId": 最后下载位置,
  "projectInfoPath": 临时配置文件位置,
  "errorLogPath": 错误日志位置,
  "targetPath": 临时文件下载位置
}
```

- downloadAllS2Info.js

> 这个是下载每一个哨兵信息的代码

```javascript
// 核心代码
const link = `https://earthexplorer.usgs.gov/form/metadatalookup/?collection_id=10880&entity_id=${projectInfo.lastId}`;
```

- insertFileToMysql.js

> 将 ```downloadAllS2Info.js``` 下载的信息规则后存储到数据

- autoInsertIntoMysql.js

> 通过监听的方式，将下载好的文件自动保存到数据库

- s2a1.sql 是 ```insertFileToMysql.js``` 中用到的表的创建语句

