export function BrandManualPage() {
  return (
    <div className="brandbook-page">
      <section className="brandbook-hero">
        <p className="brandbook-kicker">品牌手册首页终稿</p>
        <h1>羊卷岛</h1>
        <p className="brandbook-en">YANGJUAN ISLE</p>
        <p className="brandbook-subtitle">围绕原创 IP小羊卷展开的陪伴品牌</p>
        <p className="brandbook-slogan">让陪伴有颜色。</p>
      </section>

      <section className="brandbook-section">
        <h2>品牌简介</h2>
        <p>
         羊卷岛是一个围绕原创 IP 小羊卷 展开的陪伴品牌。我们从幸运色出发，把颜色、角色和日常陪伴连接在一起，
          创造一个既温柔、又有想象力的品牌世界。
        </p>
        <p>
          在羊卷岛的世界里，核心 IP 小羊卷 来自颜色云岛，会把属于今天的幸运颜色送到你身边。
          这些颜色不仅是视觉上的点缀，也是关于情绪、节奏和生活状态的温柔信号。
        </p>
        <p>
         羊卷岛希望通过网站、App，以及未来逐步展开的盲盒、玩偶、挂饰与周边，把小羊卷从一个角色，
          变成一种真正能走进生活的陪伴存在。
        </p>
      </section>

      <section className="brandbook-section">
        <h2>品牌关键词</h2>
        <div className="brandbook-tags">
          {["幸运色", "小羊卷", "陪伴", "柔软", "仪式感", "治愈", "盲盒", "周边", "日常生活"].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="brandbook-section brandbook-grid">
        <article>
          <h2>品牌主张</h2>
          <p>把颜色变成陪伴，把陪伴带进日常。</p>
        </article>
        <article>
          <h2>品牌愿景</h2>
          <p>
            以小羊卷为核心，打造一个从幸运色出发、逐步延展到盲盒、玩偶、挂饰与周边的原创陪伴品牌。
          </p>
        </article>
      </section>

      <section className="brandbook-section">
        <h2>核心结构</h2>
        <ul className="brandbook-structure">
          <li>品牌：羊卷岛</li>
          <li>核心 IP：小羊卷</li>
          <li>世界观：颜色云岛</li>
          <li>产品入口：今日幸运色</li>
          <li>品牌口号：让陪伴有颜色</li>
        </ul>
      </section>

      <section className="brandbook-section">
        <h2>命名规范</h2>
        <div className="brandbook-naming-grid">
          <article>
            <h3>标准结构</h3>
            <ul className="brandbook-structure">
              <li>品牌层：羊卷岛·小羊卷</li>
              <li>系列层：云岛幸运盲盒 / 随岛挂饰 / 今日幸运色卡 / 云岛纸品 / 云岛桌伴摆件 / 日常陪伴系列</li>
              <li>款式层：编号 + 款名（例：01 小羊卷·等风）</li>
            </ul>
          </article>
          <article>
            <h3>官网与包装写法</h3>
            <ul className="brandbook-structure">
              <li>官网主标题：系列名</li>
              <li>官网副标题：羊卷岛·小羊卷</li>
              <li>卡片标题：编号｜款名</li>
              <li>包装第一行：羊卷岛·小羊卷</li>
              <li>包装第二行：系列名 + 篇章名</li>
              <li>包装第三行：SKU + 款名</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="brandbook-section">
        <h2>SKU 规则</h2>
        <div className="brandbook-tags">
          {[
            "盲盒：B-篇章-编号",
            "挂饰：G-编号",
            "色卡：C-编号",
            "贴纸文具：S-编号",
            "摆件：D-编号",
            "生活方式：L-编号",
            "Hidden：-H",
            "Limited：-L"
          ].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="brandbook-section">
        <h2>示例</h2>
        <div className="brandbook-sample-card">
          <p>羊卷岛·小羊卷「云岛幸运盲盒」第一弹：晨雾篇</p>
          <p>B-CM-01｜小羊卷·等风</p>
          <p>B-CM-H｜Hidden 小羊卷·雾心月</p>
          <p>G-03｜小羊卷·薄荷岛</p>
          <p>C-02｜蜜桃粉</p>
        </div>
      </section>

      <section className="brandbook-section">
        <h2>禁用词建议</h2>
        <div className="brandbook-tags">
          {[
            "宝宝",
            "超萌",
            "可爱爆炸",
            "王炸",
            "顶流",
            "爆款神器",
            "标准版",
            "功能型",
            "效率款",
            "机甲",
            "战斗",
            "硬核改造"
          ].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="brandbook-closing">
        <p>今天，也为自己抽一份幸运颜色。</p>
      </section>
    </div>
  );
}

