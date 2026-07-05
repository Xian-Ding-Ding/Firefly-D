---
title: Gaussian计算笔记
published: 2026-07-03
description: "Gaussian View、Gaussian 16W、溶剂化自由能与过渡态搜索笔记。"
tags: ["Gaussian", "计算化学", "科研笔记"]
category: Gaussian
draft: false
---

# Gaussian View

<div class="note-banner gaussian-banner">
  <strong>Gaussian 计算主线：</strong>
  <span>建模与预优化 → Opt/Freq → 单点能/溶剂化 → TS/IRC → Multiwfn/VMD 可视化。</span>
</div>

chemdraw中导入cas号得分子结构,保存成默认格式到桌面,拖入chem3d,mm2对结构初步优化,保存为mol2/pdb格式文件,把mol2文件拖入gaussian view

对称化(减少计算时间) => Edit symmetrize
调整点群 => Tools选C1orCs...(current point group)

calculate => 第一个(Gaussian Calculation set up) or Ctrl+G

<div class="param-card">
  <table>
    <tbody>
      <tr><th>项目</th><th>推荐设置</th></tr>
      <tr><td><strong>Job type</strong></td><td><u>Opt+Freq</u> 或 Energy（单点能,一定要在结构优化后才能计算,打开结构优化后的 out/log 文件）</td></tr>
      <tr><td><strong>Method</strong></td><td>DFT；泛函可用 <strong>B3LYP</strong></td></tr>
      <tr><td><strong>Basis set</strong></td><td><strong>6-311++G(d,p)</strong></td></tr>
      <tr><td><strong>Link0</strong></td><td>Memory limit（计算分配内存）、shared processors（分配核数）、chk File（生成 chk 文件,死机也还在）</td></tr>
      <tr><td><strong>General</strong></td><td>勾选 Additional Print（迭代信息），不勾 Write connectivity</td></tr>
    </tbody>
  </table>
</div>
         
按Retain 
按submit(单点能) => save gjf文件

Ctrl+S将gjf文件保存到D:/Gaussian

在记事本中修改gjf文件:

```text
%chk=D:\Gaussian\toluene\toluene.chk
%nproc=4 (使用4核cpu)
%mem=1000MB (使用多少内存,默认800MB)
# M052X/6-31G* SCRF(SMD,read,solvent=generic) (read考虑非极性作用,generic自定义溶剂,常见溶剂直接输即可(完整列表可去gaussian.com/scrf查),SMD隐式溶剂模型,计算溶解自由能必须用M052X这个基组)

结构优化:
#p opt freq b3lyp/6-311+g(d,p) scrf=(read,SMD,solvent=generic)

or
#p opt freq b3lyp/6-311+g(d,p) (气相)
```

对于自定义溶剂,末尾空一行写:

```text
eps=11.5
epsinf=2.0449
HBondAcidity=0.229
HBondBasicity=0.265
SurfaceTensionAtInterface=61.24
CarbonAromaticity=0.12 (芳香C/重原子数)
ElectronegativeHalogenicity=0.24 (卤素/重原子数)
```

## 常用计算关键词

### 1. 几何优化+频率

```text
# Opt Freq SCRF=(IEFPCM,Solvent=Ethanol),SMD更准
```

### 2. 单点能量(算溶剂化能ΔG)

先跑气相:

```text
# B3LYP/6-311++G(d,p) SCRF=No
```

再跑溶液:

```text
# B3LYP/6-311++G(d,p) SCRF=(SMD,Solvent=Water)
```

a) ΔGsolv ≈ G_solution - G_gas(SMD直接给出G值)

b) 直接用SMD输出 Free Energy of Solvation

### 3. 过渡态搜索

```text
# Opt=(TS,CalcFC) Freq SCRF=(SMD,Solvent=Water)
```

### 4. 读取旧检查点继续计算(节省时间)

```text
# Geom=AllCheck SCRF=(SMD,Solvent=Water,Read)
```

<mark>输出中搜索 “Free Energy of Solvation” 或 “ΔG” 就是溶剂化自由能。</mark>

SMD会额外给出非静电贡献(Dispersion, Cavitation等)

## 计算吉布斯自由能

### 方法1: 结构优化及频率计算

1. 结构优化及频率计算(可直接submit提交,输出log文件,用的基组泛函要是网站里有的,如b3lyp/6-31G(d))
2. 更高精度单点能计算(在log文件基础上submit)
3. 打开单点能.log文件,查找HF复制
4. 记事本打开shermo目录下的ini文件,将HF粘贴到E(高精度能量);温度压力默认
5. 复制结构优化所用的基组泛函的ZPE,矫正系数sciZPE网站: https://comp.chem.umn.edu/freqscale/version3b2.htm
6. 保存 => 双击运行shermo => 把结构优化的.log或.out文件拖入 => 回车
7. 得总能量、Gibbs自由能等(total)

### 方法2: Gaussian View 直接计算

1. 将 gjf 拖入 Gaussian View
2. calculate: opt+freq, DFT, b3lyp/6-311+g(d,p), general 全部不选
3. submit(gjf)
4. 查看 log 文件中的 `sum of...free energies`

## 搜索过渡态

可先进行固定优化作为初猜结构。

### 过渡态搜索类型

<div class="method-list">
  <p><strong>TS：</strong>只需要给一个过渡态的初猜结构（推荐）</p>
  <p><strong>QST2：</strong>需要提供反应物和产物的结构</p>
  <p><strong>QST3：</strong>需要提供反应物、产物和初猜结构</p>
</div>

### TS 法流程

1. 先在 Gaussian View 中搭建过渡态初猜结构
2. 断键: 要断的键可以先拉长20%左右; 同理,要成的键也先拉长20%左右
3. 选择键长工具(第一个)
4. 选择对应的2个原子
5. Bond Type: None
6. 按住 alt,对原子进行移动
7. 选择键长工具,调整 C 和 H 之间的距离(拖动滑块)
8. calculate => opt+freq, TS(Berny) => DFT, B3LYP, 6-31G(d)
9. 关键词: `opt=calcfc,noeigen`

`calcfc`: 为过渡态搜索提供初始的 Hessian 值。

`noeigen`: 在搜索过程中不进行本征值的检测(搜索过程中不是最终的过渡态)。

保存 => 拖入到 Gaussian 中进行计算 => 结束后查看虚频(Imaginary Freq=1则正确)

也可在gjf文件设置(问AI如何设置,以下是模版)

```text
%nproc=4
%mem=1000MB
#p B3LYP/6-31G(d,p) opt=(ts,calcfc,noeigen) freq EmpiricalDispersion=GD3BJ scrf=(SMD,solvent=ethanol)

-1(体系总电荷) 1(自旋多重度)
```

末尾键连关系删掉

## IRC计算(判断过渡态找的对不对)

打开过渡态搜索后的结果 => 保存成 IRC 计算的 gjf 文件 => 记事本打开 gjf,把 opt 和 freq 内容删掉,改为:

```text
#p IRC=(calcfc,maxpoints=50,stepsize=5,LQA) b3lyp/6-31g(d,p) empiricaldispersion=gd3bj scrf=(smd,solvent=ethanol)
```

`maxpoints=50`: 从过渡态开始往两边最多跑50个点,总共101个点,默认10。

`stepsize=5`: 减小了步长,该值越小,IRC越准确,曲线越光滑。

`LQA`: 减小报错概率,默认更高精度的HPC。

保存后提交Gaussian计算 => results,IRC/path查看IRC曲线(第一个点和最后一个点是最接近产物和反应物的结构)

# Gaussian 16W

## 运行 Gaussian 16W

1. 将待计算的 gjf 文件拖入 Gaussian 16W。
2. `File Modify` 查看刚设定的信息。
3. 点击 `run`。
4. 将 out 文件保存到 `D:/Gaussian`。
5. 开始计算,出现 `processing complete` 表示计算结束。

也可以打开 Gaussian 16W 后走菜单:

```text
File new
File open
```

## 输出文件与收敛判断

点放大镜或用记事本打开 out 文件查看结果。最后一行出现 `Normal` 则说明计算正常结束。

<div class="metric-grid">
  <span><b>MF</b><small>最大受力 &lt; 0.00045</small></span>
  <span><b>RMS</b><small>方均根受力 &lt; 0.00030</small></span>
  <span><b>MD</b><small>最大位移 &lt; 0.00180</small></span>
  <span><b>RMSD</b><small>方均根位移 &lt; 0.00120</small></span>
</div>

满足上述判据可认为结构收敛(converged)。

## 查看轨道与静电势

### HOMO/LUMO 轨道

1. 点开 chk 文件(Gaussian View)。
2. 进入 `Results` 查看 summary 电子能量、偶极矩、极化率、Bond properties 键的信息等。
3. 右键 `edit` => `MOS`。
4. 最低/最高占据分子轨道的数值要乘以 `27.2114`(原子单位换成电子单位 eV)。
5. `visualize` => `HOMO`、`LUMO` => `update`。

### 静电势图

```text
results
surface/contours
remove cube/surface
new cube/mapped surface
type: total density/ESP
```

### 导出 fch 并用 Multiwfn 查看轨道

```text
File
save Temp Files
保存 fch 文件到 D:/Gaussain
打开 Multiwfn
拖入 fch 文件
回车
0
回车
查看分子轨道(HOMO,LUMO)
```

## 查看优化过程

若要在 Gaussian 计算过程中或计算结束后查看具体优化趋势:

1. 打开 Gaussian View。
2. `File` => `open`。
3. 选择 out 文件。
4. 文件 type 选择第二个 `gjf...gfrq`。
5. 勾选 `Read...(Optimization)`。
6. `open` => `view` => `optimization`。

# Multiwfn+VMD

优化后至少有六个文件(要算单点能energy,gjf文件计算)

## 生成并准备 fch 文件

1. 打开 Gaussian 16W。
2. `utilities` => `formchk`。
3. 选择计算完后的单点能.chk 文件。
4. 打开并查看已经绘制完成的结果。
5. 关闭后会多出来一个 `.fch` 文件。
6. 打开 fch 文件查看 HOMO、LUMO 轨道(上 lumo,下 homo)。
7. 复制该 fch 文件。

## VMD 渲染轨道图

1. 把 fch 文件粘贴到 Multiwfn 文件路径中。
2. 修改 `showorb.txt` 中轨道数值,改成需要计算的 HOMO、LUMO 轨道。
3. 编辑 `showorb.bat`,文件名字要和 fch 名字一样；VMD 路径要改成自己的路径。
4. 双击该 `.bat` 文件。
5. 打开 VMD。

常用 VMD 命令与渲染流程:

```text
orb 25
orbiso 0.02
```

`orb 25`: 先看 HOMO/LUMO 同理。

`orbiso 0.02`: 修改电子云大小,数字越小电子云越大。

渲染步骤:

1. 打开 `VMDrender.txt` 并全部复制。
2. 粘贴至 VMD 程序。
3. `File` => `render`。
4. 第一个改成 `tachyon`,第二个不变,第三个删掉 `-format...`。
5. `start rendering` 开始渲染。
6. 双击 `VMDrender_full.bat`。
7. 渲染完成得到 `.bmp` 图片。

## 绘制分子表面静电势

### 生成 ESP 文件

1. 复制优化后的 fch 文件到 Multiwfn 目录。
2. 名字改成 `1`。
3. 将 `ESPiso.bat` 等 bat 文件中的 VMD 目录改成自己的。
4. 双击 `ESPiso.bat`,生成分子的密度文件和表面静电势文件。
5. 双击 `ESPext.bat`,生成分子结构文件、分子静电势表面顶点文件及分子静电势表面极值文件。
6. 打开 VMD,输入 `iso` 得静电势表面。
7. 输入 `ext` 得极值点。

<div class="method-list">
  <p><strong>蓝色：</strong>负极区域</p>
  <p><strong>红色：</strong>正极区域</p>
  <p><strong>黄色小球：</strong>正极局部极值点</p>
  <p><strong>青色小球：</strong>负形区域局部极值点</p>
</div>

后续渲染同上。

### 静电势图美化

1. 输入 `iso` 后设置 `display orthographic`(视角正交)。
2. 去 Multiwfn 看极大极小值。
3. 在 VMD 中输入:

```text
mol scaleminmax 0 1 -0.07 0.04(a.u.)
```

4. `graphic colors` => `color scale` => `RWB`。
5. `graphic`(第一个)查看等值面材质是 `transparent`。
6. `graphic materials` 中找到 `trans`。
7. 调整 `shiness=0.75` 和 `opacity=0.43`。
8. `ext` 显示极值点。
9. 用文本打开 VMD 中的 `surfanalysis.pdb`(显示1-4,实际0-3极小极大同理)。
10. 点 VMD 的图形窗口激活,按 `0` 进入查询模式。
11. 点极值点小球正中心得到极值。若显示 `index1`,则对应 pdb 中为 `2`。
12. 删掉第一行注释,第二行倒数第二列即为静电势极值,即 `C` 前面那个,注意单位。
13. 渲染 tachyon 得 bat 文件。

### 图例(刻度轴)绘制

1. 用 Multiwfn 找极大极小值。
2. 导入 fch 文件。
3. 输入 `12`、`0`,看 `the number of surface minima/maxima`。
4. `Extensions` => `Visualization` => `color scale bar`。

## 绘制 IGMH 分析图

1. Gaussian 16W 对两个分子进行结构优化。
2. 打开 fchk 文件,`view` => `labels`,确定片段1的原子序号。
3. 把 fchk 文件拷到 Multiwfn 目录下并拖入。
4. 输入 `20`(弱相互作用的可视化)。
5. 输入 `11`(IGMH分析)。
6. 输入 `2`(分子片段个数)。
7. 输入 `1-3/4-10`(片段1/2的原子序号,例如水分子/甲苯...)。
8. 输入 `c`(剩余所有原子)。
9. 输入 `3`(选用高质量格点)。
10. 输入 `3`(输出 cub 文件)。
11. 输入 `2`(输出 output.txt,后续散点图)。
12. 把4个 cub 文件剪切到 VMD 目录下,其实就2个有用: `dg_inter` 和 `sl2r`。
13. 把 `IGM_inter.vmd` 脚本中的 Isosurface(等值面)改成 `0.00500`。
14. 在 VMD 中输入:

```text
source IGM_inter.vmd
```

若要修改等值面大小,打开 `graphic representation`,其中 `Isovalue` 越小,等值面越大。

渲染 `render` 后,把 `output.txt` 文件复制到 `gnuplot/bin` 目录下,把 `IGMscatter.gnu` 拖入 `gnuplot.exe`,得到散点 ps 文件。

# Multiwfn

## 绘制定域化轨道指示函数(LOL)

1. 先生成 `1.fchk` 或 `1.wfn` 文件,复制到 Multiwfn 目录下。
2. 打开 Multiwfn,输入 `1.wfn`。
3. 输入 `4`(在平面上绘制图形)。
4. 输入 `10`(LOL)。
5. 输入 `1`(不投影)或 `5`(带投影)。
6. 输入 `200,200`(格点数),或直接回车使用默认值。
7. 选择平面。
8. 输入 `0`(Z=0,平面)或 `0.5`(Z轴范围)。
9. `return` => `-6`(txt文件) => `0`(图片)。PDF 原始记法: `return => -6(txt文件) => 0(图片)`。

<div class="method-list">
  <p><strong>XY：</strong>平面 1</p>
  <p><strong>XZ：</strong>平面 2</p>
  <p><strong>YZ：</strong>平面 3</p>
</div>

<style>
  .note-banner {
    border: 1px solid color-mix(in srgb, var(--primary) 42%, var(--line-color));
    border-left: 5px solid var(--primary);
    border-radius: 12px;
    padding: 1rem 1.1rem;
    margin: 1rem 0 1.25rem;
    background: color-mix(in srgb, var(--primary) 10%, transparent);
    line-height: 1.75;
  }

  .note-banner strong {
    color: var(--btn-content);
    font-weight: 800;
  }

  .param-card {
    border: 1px solid var(--line-color);
    border-radius: 12px;
    padding: 0.75rem 1rem;
    margin: 1rem 0;
    background: color-mix(in srgb, var(--btn-regular-bg) 70%, transparent);
  }

  .param-card table {
    margin: 0;
  }

  .method-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.65rem;
    margin: 1rem 0 1.2rem;
  }

  .method-list p {
    margin: 0;
    border: 1px solid var(--line-color);
    border-left: 4px solid var(--primary);
    border-radius: 10px;
    padding: 0.75rem 0.9rem;
    background: color-mix(in srgb, var(--btn-regular-bg) 72%, transparent);
    line-height: 1.75;
  }

  .param-card strong,
  .method-list strong,
  mark {
    color: var(--btn-content);
  }

  .metric-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.65rem;
    margin: 1rem 0 1.25rem;
  }

  .metric-grid span {
    border: 1px solid var(--line-color);
    border-radius: 10px;
    padding: 0.75rem;
    background: color-mix(in srgb, var(--btn-regular-bg) 72%, transparent);
    text-align: center;
  }

  .metric-grid b {
    display: block;
    color: var(--btn-content);
    font-size: 1rem;
    margin-bottom: 0.2rem;
  }

  .metric-grid small {
    display: block;
    line-height: 1.5;
  }

  mark {
    background: color-mix(in srgb, var(--primary) 16%, transparent);
    border-radius: 0.35rem;
    padding: 0.05rem 0.3rem;
  }

  @media (max-width: 720px) {
    .metric-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
