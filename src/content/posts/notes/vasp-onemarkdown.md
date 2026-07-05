---
title: VASP计算笔记
published: 2026-07-03
description: "从 OneMarkdown 同步的 VASP 结构优化、输入文件、运行与后处理笔记。"
tags: ["VASP", "计算化学", "科研笔记", "OneMarkdown"]
category: VASP
draft: false
---

# 一、VASP结构计算(结构优化opt)

<div class="note-banner vasp-banner">
  <strong>VASP 计算主线：</strong>
  <span>结构优化 → 静态自洽 → 非自洽 DOS/能带 → 电荷分析/吸附能/过渡态。</span>
</div>

## 1.准备四个输入文件：POSCAR、INCAR、KPOINTS、POTCAR

<div class="file-grid">
  <span><b>POSCAR</b><small>结构与晶胞</small></span>
  <span><b>INCAR</b><small>计算参数</small></span>
  <span><b>KPOINTS</b><small>布里渊区采样</small></span>
  <span><b>POTCAR</b><small>赝势文件</small></span>
</div>

#### (1)POSCAR

<mark>从网站上下载晶体结构的 cif 文件</mark>

<div class="workflow-list">
  <p><strong>1. 获取结构</strong><span>从材料数据库或网站下载晶体结构的 cif 文件。</span></p>
  <p><strong>2. VESTA 转换</strong><span>将 cif 拖入 VESTA,选择 File export data 导出 POSCAR。</span></p>
  <p><strong>3. 坐标格式</strong><span>导出时选择 fractional,在 POSCAR 中对应 direct。</span></p>
  <p><strong>4. 写入服务器</strong><span>打开 mobaxterm,用 vim POSCAR 把内容复制进去。</span></p>
</div>

#### (2)INCAR

vim INCAR(下面是INCAR文件内容)

i(INSERT输入)

```text
# Comments
SYSTEM = Catalyst (任务名称,不影响结果)

# I/O (文件读入读出)
ISTART = 0 (0:全新的计算) 
ICHARG = 2 (0:从初始轨道计算电荷密度;1:读入已有的电荷密度文件,并开始新的自洽计算;2:直接使用原子电荷密度的叠加作为初始密度)
LWAVE = .FALSE. (以下四个很大的文件,一般Fasle即可)
LCHARG = .FALSE.
LVOT = .FALSE.
LELF = .FALSE.

# Electronic Relaxation (电子步/电子弛豫)
ENCUT = 600 (平面截断能,越大精度越高,一般取POTCAR里ENMAX的1.25~1.5倍,含氧体系一般设成650)
NELM = 100 (电子步的最大迭代次数,一般100步以内就可收敛)
ALGO = Fast (自洽循环的算法,有very fast、fast(前半用very fast,后半用normal)、normal;对于其他的泛函,要设置成特定的值)
PREC = Accurate (精度,一般accurate即可)
ISMEAR = 1 (布里渊区划分,未知体系0,金属体系1/2,非金属体系一般0/负数)
SIGMA = 0.05 (展宽,半导体/绝缘体0.05,金属体系0.2)
EDIFF = 1E-5 (电子步收敛的精度,1E-5/-6即可)
AMIX = 0.1 (对于复杂的表面体系、过度金属等可设A/BMIX,加快收敛)
BMIX = 0.01

# Ionic Relaxation (离子步/离子弛豫,静态计算时全部关闭)
IBRION = 2 (离子弛豫/结构优化的算法,-1不更新结构静态计算,0分子动力学MD,2最保险的算法共轭梯度法CG,1准牛顿法初始结构和最终结构相似)
NSW = 300 (离子步的最大迭代次数,取决于晶体结构复杂度,一般几百即可,0是静态自洽)
EDIFFG = -1E-2 (离子步收敛的精度,不设置时默认是EDIFF的10倍)
ISIF = 3 (3全弛豫,2固定体积弛豫,4固定体积形状可变弛豫)

# Polarization (对含磁性的体系才需要设置,Fe2O3有磁性magnetic)
ISPIN = 2 (2自旋极化,DOS分裂为两条独立曲线;1非磁性计算,关闭自旋极化,适于无未配对电子的体系,态密度DOS单一连续曲线)
LOSRBIT = .False. (是否考虑非线性磁性,默认不考虑)

# Parallization (并行设置,以下为推荐设置)
LREAL = Auto (决定计算是在实空间/倒空间进行)
NPAR = 1 (取cpu数量的根号)
LPLANE = .FALSE.
```

esc => `:wq`(保存并退出)

#### (3)KPOINTS

vim KPOINTS (对布里渊区网格的划分,有gamma center/mp两种自动划分方法;gamma比较保险,保证gamma点在sample内;mp要注意奇偶性,可能gamma点不在之内,六方的不适合)

i

```text
Automatic mesh
0
Gamma
8 8 8
0.0 0.0 0.0
```

esc => `:wq`

或命令行:

```text
vaspkit -task 102 -kpr 0.04
```

`102`: 直接生成规则网格 KPOINTS。

`2`: 选择 Gamma centered。

交互式路径:

```text
vaspkit
102
2
0.04
```

#### (4)POTCAR

soft 里有 pbe、lda 赝式库(PAW_PBE/LDA_US)。

<div class="workflow-list compact">
  <p><strong>推荐赝式</strong><span><code>vaspkit -task 103</code></span></p>
  <p><strong>生成 POTCAR</strong><span><code>vaspkit -task 104</code>,按 POSCAR 中元素顺序输入,生成 POTCAR 文件。</span></p>
</div>


## 2.运行vasp计算

```text
export PATH=$PATH:/home/edu/opt (输出路径)
mpirun -np 4 vasp_std (使用4核cpu计算)
```


## 3.突然中止如何续算

1.cp CONTCAR POSCAR (将中断后生成的CONTCAR文件替换为新的POSCAR文件)

2.在INCAR文件中修改以下参数:

```text
ISTART = 1 (从WAVECAR文件继续计算波函数)
ICHARG = 1 (读取CHGCAR文件中的电荷密度作为初始猜测)
LCHARG = .TRUE. (在计算过程中写入新的电荷密度文件)
```

3.保持其他输入文件(如KPOINTS、POTCAR)不变,重新提交计算任务


## 4.查看输出文件

#### (1) OSZICAR

```text
vi OSZICAR
grep E0 OSZICAR
```

<div class="metric-grid">
  <span><b>N</b><small>电子步迭代步数</small></span>
  <span><b>E</b><small>当前电子步总能</small></span>
  <span><b>dE</b><small>该步与上一步总能差值</small></span>
  <span><b>F</b><small>前面的数字代表离子步步数</small></span>
</div>

拉到最后一行,如 `3F` 表示经历 3 个离子步。主要看最终优化结构后的总能 `E0`,对应 OUTCAR 中 sigma 趋于 0 时的能量。

`DAV` 表示电子部分优化算法采用稳定性较好的 blocked Davidson 算法。
<br/>
<br/>
#### (2) OUTCAR

OUTCAR 包含 VASP 所有输入信息(如赝式等)以及每步迭代的详细情况,相当于运行日志文件。各个输出部分用横杠分割。

```text
vim OUTCAR
G (跳到最后一行,看计算时间等)
grep 'reached required accuacy' OUTCAR
```

没有 `reached required accuacy` 这个字符则说明没有收敛。

通过 OUTCAR 查看 POTCAR 中的元素可使用以下命令:

```text
grep POTCAR OUTCAR
grep TIT OUTCAR
grep ENMAX OUTCAR
```

POSCAR 的一些基本信息包括: 坐标格式(笛卡尔坐标系)、原子(或离子)位置、晶胞的形状和大小。

K 点信息,查看 K 点个数:

```text
grep irreducible OUTCAR / grep NKPTS OUTCAR
```

电子步迭代结束输出的主要结果:费米能级以及能带信息


<br/>

# 二、VASP静态自洽计算(电子自洽scf)


## 1.准备输入文件

#### (1) POSCAR(复制结构优化后的CONTCAR)

#### (2) INCAR

在之前的基础上修改(关闭所有结构优化的参数):

```text
# I/O (文件读入读出)
ISTART = 0 
ICHARG = 2
LWAVE = .TRUE. (保存波函数,用于后续非自洽计算)
LCHARG = .TRUE. (确保为True)
LVOT = .TRUE.
LELF = .TRUE.
LORBIT = 11 (10:计算每个原子的局域态密度LDOS,分解为s、p、d轨道,不进行进一步分解;11:计算投影态密度PDOS或部分态密度,分解为s、p、d、f轨道并进一步分解为方向向量px、py、pz,允许进行详细的轨道分析)

# Electronic Relaxation (电子步)
ENCUT = 600 
NELM = 100 
ALGO = Fast 
PREC = Accurate 
ISMEAR = 1 (未知体系0,金属1/2,-5电子精度高,适合半导体/绝缘体、DOS/能带计算)
SIGMA = 0.05 
EDIFF = 1E-5 
AMIX = 0.1 
BMIX = 0.01
上述基本不变(与结构优化时的基本相同),若要设置准确的态密度DOS则在末尾增加以下三条:
NEDOS = 2000 (在该能级范围内取多少点)
EMIN = -10.0 
EMAX = 10.0 (电子能级划分范围,一般10就够了,能看到费米能级Ef-10到Ef+10的态密度)

# Ionic Relaxation (离子步,全部关闭/直接不设置)
IBRION = -1 (离子弛豫/结构优化的算法,-1不更新结构静态计算)
NSW = 0 (0静态自洽)
EDIFFG = -1E-2 (离子步收敛的精度,不设置时默认是EDIFF的10倍)
ISIF = 2 (3全弛豫,2固定体积弛豫,4固定体积形状可变弛豫)

# Polarization (对含磁性的体系需要设置)
ISPIN = 2 
LOSRBIT = .False. (是否考虑非线性磁性,默认不考虑,可不设置)
```

#### (3) KPOINTS

vim KPOINTS

```text
Automatic mesh
0
Gamma
8 8 8 (自己设置,要比结构优化时的大)
0.0 0.0 0.0
```

或Automatic mesh

```text
0
Auto
25.0 -> 改成60.0(对于金属性强的体系要更大如100.0)
```

或vaspkit -task 102 -kpr 0.04 (自洽计算用的kpoints)


#### (4) POTCAR(复制结构优化时的即可,或vaspkit生成)


## 2.运行vasp计算

```text
export PATH=$PATH:/home/edu/scf (输出路径)
mpirun -np 4 vasp_std (使用4核cpu计算)
```


## 3.查看输出文件(绘制态密度、能带,求解d带中心)


#### (1)绘制态密度DOS、能带图(能带最好在非自洽计算后再画)

### 查看原子序号

1. 将 POSCAR 文件拖入 VESTA。
2. `edit` => `edit data` => `structure parameters`。
3. 或者 `objects` => `L` 全选。

### p4v 绘图流程

1. `p4v open vasprun.xml`。
2. `DOS+bands`。
3. 选择 `Electronic Local DOS` 或 `show band`(能带)。
4. 输入原子序号或元素名。
5. 选择轨道画图。
6. `Graph export data(.dat)`。
7. 用 Origin 作图,一般需要先用 Excel 处理一下。
8. 堆积图: 2 个原子图层数目 2,每一图层的曲线数目 `2 2`(如 d 轨道 spin up 和 down)。
9. 添加参照线: 细节 => 追加 => 位置 0 => 黑色 => 划线。

若要绘制填充折线图:

1. 双击左上角 `1`。
2. 图层1全选。
3. 解散组。
4. 双击曲线。
5. 启用填充: 填充到数据图 => 单色 => background => 图案选择颜色。

也可使用 vaspview 作图: 导出 txt 数据文件,再用 Origin 作图。


#### (2)求解金属原子d带中心

$$
\epsilon_d=\frac{\int_{-\infty}^{+\infty}E\cdot\rho_d(E)dE}{\int_{-\infty}^{+\infty}\rho_d(E)dE}
$$

### Origin 求解流程

1. 打开 Origin。
2. 将 Fe/O 的 d 带中心轨道态密度拖入。
3. `x` 就是 `E`,`y` 就是 PDOS(即 $\rho_d(E)$)。
4. 新增一列 Y,命名为 `E×PDOS`(即 $E\cdot\rho_d(E)$)。
5. 分析 => 数学 => 设置列值,公式是 `A*B`。
6. 作图。
7. 对两个函数进行积分。首先选中 `E×PDOS`(右侧对象管理器选中),快捷分析积分,范围 `-100` 到 `+100`,得到数学面积并复制。
8. 新建一个 sheet,粘贴到 Y,再增加两列(一共 3 个 Y)。
9. 同理再对 PDOS 积分。
10. 求出 d 带中心 `B/C`,单位 eV。

### vasp view 求解流程

1. 点态密度。
2. 导入 DOSCAR。
3. 点击 PDOS。
4. 将 s、p 轨道去除。
5. 填原子序号,如 `49-49`。
6. 点设置,得到平均 d 带中心。




# 三、VASP非自洽计算(能带/态密度)


## 1.准备输入文件

#### (1) POSCAR(复制自洽的POSCAR)

#### (2) INCAR

```text
# I/O (文件读入读出)
ISTART = 1 (1从scf已有波函数WAVECAR和电荷密度CHGCAR继续计算) 
ICHARG = 11 (11从自洽好的静态电荷密度出发,只计算能带/DOS,不更新电荷密度)
LWAVE = .FALSE.
LCHARG = .TRUE. (确保为True)
LVOT = .TRUE.
LELF = .TRUE.
LORBIT = 11 (10:计算每个原子的局域态密度LDOS,分解为s、p、d轨道,不进行进一步分解,只输出总态密度DOSCAR;11:计算投影态密度PDOS或部分态密度,分解为s、p、d、f轨道并进一步分解为方向向量px、py、pz,允许进行详细的轨道分析,输出DOSCAR+PROCAR)

# Electronic Relaxation (电子步)
ENCUT = 600 
NELM = 100 
ALGO = Fast 
PREC = Accurate 
ISMEAR = -5 (金属:dos用-5/能带还是用1)
SIGMA = 0.05 
EDIFF = 1E-5 
AMIX = 0.1 
BMIX = 0.01
上述基本不变(与结构优化时的基本相同),若要设置准确的态密度DOS则在末尾增加以下三条:
NEDOS = 2000 (在该能级范围内取多少点)
EMIN = -10.0 
EMAX = 10.0 (电子能级划分范围,一般10就够了,能看到费米能级Ef-10到Ef+10的态密度)

# Ionic Relaxation (离子步,全部关闭/直接不设置)
IBRION = -1 (离子弛豫/结构优化的算法,-1不更新结构静态计算)
NSW = 0 (0静态自洽)
EDIFFG = -1E-2 (离子步收敛的精度,不设置时默认是EDIFF的10倍)
ISIF = 2 (3全弛豫,2固定体积弛豫,4固定体积形状可变弛豫)

# Polarization (对含磁性的体系需要设置/可不设置)
ISPIN = 2 
LOSRBIT = .False. (是否考虑非线性磁性,默认不考虑,可不设置)
```

#### (3) KPOINTS(dos和能带不一样)

DOS(类似自洽计算):
vaspkit -task 102 -kpr 0.04 (精度:0.06\~0.04较粗;0.04\~0.03常用;0.02\~0.01精细,计算量大)

band:
vaspkit -task 302
cp KPATH.in KPOINTS (能带用line-mode路径)


#### (4) POTCAR(复制自洽的POTCAR)


#### (5) 复制自洽的CHGCAR和WAVECAR


## 2.运行vasp计算

```text
export PATH=$PATH:/home/edu/scf (输出路径)
mpirun -np 4 vasp_std (使用4核cpu计算)
```


<br/>

# 四、差分电荷密度、ELF、bader分析


以氧气分子为例。

## 1. 分子结构优化

```text
mkdir part
cd part
```

<div class="workflow-list">
  <p><strong>上传结构</strong><span>将分子的 POSCAR 文件上传到 part 文件夹。</span></p>
  <p><strong>检查文件</strong><span><code>ls</code>、<code>cat POSCAR</code> 查看结构文件。</span></p>
  <p><strong>生成输入</strong><span><code>vaspkit</code> => <code>101</code> => <code>SR</code>; 再用 <code>102</code> => <code>2</code> => <code>0.04</code> 生成 KPOINTS 和 POTCAR。</span></p>
  <p><strong>自旋设置</strong><span><code>vi INCAR</code>,将 <code>ISPIN</code> 改成 <code>2</code>。</span></p>
  <p><strong>核对赝势</strong><span><code>cat KPOINTS</code>, <code>grep TIT POTCAR</code>。</span></p>
</div>

运行结构优化计算:

```text
export PATH=$PATH:/home/edu/scf (输出路径)
mpirun -np 4 vasp_std (使用4核cpu计算)
```

## 2. 静态自洽与网格设置

结构优化完成后:

```text
grep NGXF OUTCAR (得到NGXF=80,NGYF=80,NGZF=96)
mv CONTCAR POSCAR (将结构优化后的CONTCAR文件重命名为POSCAR文件)
vi INCAR
```

修改 INCAR 文件,删除其中的结构优化计算相关参数(离子步 Ionic Relaxation 全删除),并添加以下设置:

```text
NGXF = 80
NGYF = 80
NGZF = 96
LCHGCAR = T
LELF = T
LAECHG = T
```

然后运行 `vasp_std` 做静态自洽计算。

## 3. 差分电荷计算

创建 A、B 两个计算文件夹:

```text
mkdir A
cp INCAR POSCAR KPOINTS POTCAR A
mkdir B
cp INCAR POSCAR KPOINTS POTCAR B
```

<div class="workflow-list">
  <p><strong>A 文件夹</strong><span><code>cd A</code> => <code>vi POSCAR</code>,删除第二个氧原子,即 Direct 下第二行的 0 删除,Direct 上方的 2 改成 1,然后运行 <code>vasp_std</code>。</span></p>
  <p><strong>B 文件夹</strong><span><code>cd ../B</code> => <code>vi POSCAR</code>,删除第一个氧原子,即 Direct 下第一行的 0 删除,Direct 上方的 2 改成 1,然后运行 <code>vasp_std</code>。</span></p>
  <p><strong>差分电荷</strong><span><code>cd ..</code> 回到 part 文件夹,在 vaspkit 中选择 <code>31</code> => <code>314</code>,依次输入 <code>CHGCAR A/CHGCAR B/CHGCAR</code>,得到 CHGDIFF.vasp。</span></p>
</div>

将 `CHGDIFF.vasp` 下载到本地电脑,用 VESTA 打开即得差分电荷密度图。点击 boundary 修改显示范围。

## 4. ELF 与 bader 分析

1. 将 ELFCAR 文件下载到本地电脑,用 VESTA 打开。
2. 修改显示范围,点击原子选择合适的切面显示。
3. 在 slice 中继续调整显示范围。

Bader 分析命令:

```text
chgsum.pl AECCAR0 AECCAR2
bader CHGCAR -ref CHGCAR_sum
cat ACF.dat
grep ZVAL POTCAR
```

得到 ACF.dat、BCF.dat 等文件后,用 `grep ZVAL POTCAR` 查看元素价电子数,再和 charge 对比判断失去/获得多少电子。

## 5. MS 建模路线

1. 在 MS 中建模,直接导入结构优化后的模型,在此基础上删除修改。
2. 准备 AB(如 Fe2O3+氧空位/吸附物晶格氧/掺杂等)、A(Fe2O3)、B(氧空位/...)。
3. 分别导出为 cif 文件: POSCAR_AB、POSCAR_A、POSCAR_B。
4. 注意删除原子时位置保持不变。
5. 用 vaspview 将 cif 转化为 POSCAR 文件。
6. 将这几个 POSCAR 文件下载到服务器中的三个文件 AB、A、B 中。
7. 制作其他计算输入文件。
8. 分别或批量提交计算任务即可。

 
<br/>


# 五、吸附能计算


<div class="workflow-list">
  <p><strong>建表面</strong><span>下载正确的 cif 文件(华算科技官网/material project),导入 MS,构建表面模型,如 1 0 0 表面,thickness 选 4 层。</span></p>
  <p><strong>转 POSCAR</strong><span>导出为 cif 格式 POSCAR,用 vaspview 再转化成 POSCAR 文件。</span></p>
  <p><strong>固定底层</strong><span>对表面原子做结构优化时,固定底下的半层原子用于模拟体相。</span></p>
  <p><strong>提交结构优化</strong><span><code>cat POSCAR</code>, <code>cat INCAR</code> 检查标准参数后提交任务。</span></p>
  <p><strong>构建吸附模型</strong><span>将优化好的 CONTCAR 拖入 MS,构建气体吸附模型,如吸附晶格氧。</span></p>
  <p><strong>能量对比</strong><span>同理计算吸附体系、纯 slab 和纯气体,得到 3 个能量值。</span></p>
</div>

$$
E_{\mathrm{ads}}=E_{\mathrm{total}}-E_{\mathrm{slab}}-E_{\mathrm{adsorbent}}
$$

<br/>


# 六、过渡态计算(CINEB方法)


## 1.建模及提交计算

以氢表面转移的过渡态计算为例。

### 建模流程

1. 下载 cif 文件并导入 MS 建模。
2. 选择 `ball and stick`,Lattice color 选黑色。
3. `Build` => `surface` => `cleave surface` 切一个表面。
4. cleave plane 选择 `1 0 0`,厚度选 4 层,color 黑色。
5. `build` => `crystals` => `build vacuum slab` => `build`,增加 15 Å 真空层。
6. `build` => `symmetry` => `supercell`,扩胞做一个 `4*4` 的超胞。

### 构建初末态

1. 构建氢吸附的初态。
2. 选中下方三层原子(变黄色)。
3. 右键 `display style` => `stick`。
4. 画一个 H,连接其他位置原子。
5. export 导出成 cif,命名为 `POSCAR_IS`。
6. 末态将 H 移动到另一个位置,同样导出为 cif,命名为 `POSCAR_FS`。
7. 用 vaspview 将 2 个文件批量转化为 POSCAR 文件。
8. 对这两个文件先进行结构优化。
9. 将优化好的两个文件分别放入 `IS` 和 `FS` 文件夹。

### VTST 插点

```text
dist.pl ./IS/POSCAR ./FS/POSCAR
nebmake.pl ./IS/POSCAR ./FS/POSCAR 2
```

`dist.pl`: 检查初末态结构原子位置差异性,不大于 5 就可以做过渡态搜索计算。

`nebmake.pl`: 在初末态中间插点。一般需要尝试,对前一步得到的值除以 0.6~0.8 取整,先插 2 个点试试。

得到过渡态计算的结构文件后,打开文件目录,把输入文件准备在这个目录下:

```text
00 01 02 03 FS IS INCAR KPOINTS POTCAR
```

最后提交任务即可。

其中INCAR文件:

```text
ISMEAR = 0
SIGMA = 0.05
ALGO = Fast

NSW = 500 (离子步数,可设大点)
IBRION = 3 (使用过渡态搜索里的算法,1:插的点基本就是反应路径;3:初末态结构不是很理想,插的点也一般时)
POTIM = 0 (步长,一般0.1~1.0之间即可)
IPOT = 2
ICHAIN = 0 
LCLIMB = .TRUE. (启用CINEB方法搜索过渡态)
IMAGES = 2 (插入点的数目)
SPRING = -5 (防止过于偏移,一般设为-5)
EDIFF = 1E-5
EDIFFG = -0.02 (或者不设置)
```

<br/>

## 2.结果分析

将初始和末态结构计算得到的OUTCAR分别拷贝到00和03文件夹中,输入nebresults.pl得相关结果文件,nebef.dat,第二列即为最大受力,第三列为相应结构的能量,neb.dat文件第二列为距离,第三列为能量(以初态能量为参考值),第四列为力,将neb.dat下载到本地,导入origin绘图

<br/>


# 七、COHP计算


## 高精度单点能计算(准备好四个输入文件)+提交龙虾程序

<div class="workflow-list">
  <p><strong>赝式</strong><span>赝式文件需要用 PAW 版本,可用 <code>grep PAW POTCAR</code> 检查。</span></p>
  <p><strong>VASP 版本</strong><span>不能用 gamma 版,要用标准版。可用 <code>cat sub-vaspl</code> 或类似脚本查看是否调用 <code>bin/vasp_std</code>。</span></p>
  <p><strong>清理波函数</strong><span>如果之前结构优化保存了 WAVECAR,需要删除,如 <code>rm WA</code>。</span></p>
  <p><strong>单点能</strong><span><code>vi INCAR</code> 修改参数后跑单点能。</span></p>
  <p><strong>LOBSTER</strong><span>单点能跑完后,用 <code>tail -f output</code>、<code>cat lobsterin</code> 检查龙虾程序输入,再提交 COHP 计算。</span></p>
</div>

其中INCAR参考设置如下:

```text
SYSTEM = test

LWAVE = .TRUE.
LCHARG = .TRUE.

ISMEAR = 0
SIGMA = 0.05

NSW = 0
IBRION = -1
POTIM = 0.5

ISYM = -1 (对称性,要用-1,0也可)
NBANDS = 200 (需要设置的比平时高一点,1.5~2倍结构优化时的该默认值)
```

<br/>
<br/>


# 八、脚本提交vasp计算


## 1.判断服务器系统

输入 `sbat` 或 `qsu`,按一下 tab,如果填充成功则为 slurm/PBS 系统。


## 2.获取并修改脚本

获取 slurm 脚本(管理员、师兄师姐、翻找):

```text
grep -r --include="*.sh" "vasp_std" .
```

![](assets/17799381978744.jpg)

一般只需要修改名字、节点名称、数量、总核数。

<div class="workflow-list compact">
  <p><strong>-J</strong><span>表示 job name,如结构优化 <code>opt_Si</code>,自洽计算 <code>scf_Si</code>。</span></p>
  <p><strong>sinfo</strong><span>查看超算有哪些节点。比如有 comput40,节点名称 comput,有 40 个节点,可以选择调用 2 个节点。</span></p>
  <p><strong>sinfo -lN</strong><span>查看核数。比如 comput 节点 CPUS=40,2×40=80,即总核数≤节点数×核数。</span></p>
</div>


## 3.作业管理(提交/查看/取消)

```text
cd 路径
vi run.sh
sbatch run.sh
squeue
squeue -o "%.18i %.9P %.8j %.8u %.2t %.10M %.6D %Z" -u $USER
scancel 642552
```

<div class="workflow-list compact">
  <p><strong>修改脚本</strong><span><code>vi run.sh</code></span></p>
  <p><strong>提交作业</strong><span><code>sbatch run.sh</code></span></p>
  <p><strong>查看进度</strong><span><code>squeue</code>,有作业号但没路径。</span></p>
  <p><strong>查看路径</strong><span><code>squeue -o "%.18i %.9P %.8j %.8u %.2t %.10M %.6D %Z" -u $USER</code>,给出作业具体路径,再 cd 进入该路径。</span></p>
  <p><strong>取消作业</strong><span><code>scancel 642552</code>,其中 642552 是 JOBID。</span></p>
</div>

<style>
  .note-banner {
    border: 1px solid color-mix(in srgb, var(--primary) 45%, var(--line-color));
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

  .file-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.65rem;
    margin: 1rem 0 1.25rem;
  }

  .file-grid span {
    border: 1px solid var(--line-color);
    border-radius: 10px;
    padding: 0.75rem;
    background: var(--btn-regular-bg);
    text-align: center;
  }

  .file-grid b {
    display: block;
    color: var(--btn-content);
    font-size: 1rem;
  }

  .file-grid small {
    display: block;
    margin-top: 0.25rem;
    color: var(--content-meta);
    font-size: 0.78rem;
  }

  .workflow-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 0.65rem;
    margin: 1rem 0 1.25rem;
  }

  .workflow-list.compact {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }

  .workflow-list p {
    margin: 0;
    border: 1px solid var(--line-color);
    border-left: 4px solid var(--primary);
    border-radius: 10px;
    padding: 0.75rem 0.9rem;
    background: color-mix(in srgb, var(--btn-regular-bg) 72%, transparent);
    line-height: 1.75;
  }

  .workflow-list strong {
    display: block;
    color: var(--btn-content);
    margin-bottom: 0.25rem;
  }

  .workflow-list span {
    display: block;
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
    color: var(--btn-content);
    background: color-mix(in srgb, var(--primary) 16%, transparent);
    border-radius: 0.35rem;
    padding: 0.05rem 0.3rem;
  }

  @media (max-width: 760px) {
    .file-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .metric-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
