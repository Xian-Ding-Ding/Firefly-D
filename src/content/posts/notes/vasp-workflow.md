---
title: VASP计算流程
published: 2026-07-03
description: "从输入文件准备、结构优化到结果检查的 VASP 计算流程模板。"
tags: ["VASP", "计算化学", "科研笔记"]
category: VASP
draft: false
---

## 计算前准备

VASP 计算通常从四个核心输入文件开始：`POSCAR`、`INCAR`、`KPOINTS` 和 `POTCAR`。在提交任务前，建议先检查结构坐标、元素顺序、赝势版本和计算参数是否一致。

## 基本流程

1. 准备初始结构并检查元素顺序。
2. 设置结构优化参数，例如 `ENCUT`、`EDIFF`、`EDIFFG`、`IBRION` 和 `ISIF`。
3. 生成合适的 K 点网格。
4. 提交任务并监控 `OUTCAR`、`OSZICAR` 和 `CONTCAR`。
5. 检查能量是否收敛、力是否达标、结构是否合理。

## 常见检查点

- `reached required accuracy` 是否出现。
- 最大受力是否低于设定阈值。
- `CONTCAR` 是否为空。
- 体系磁矩、能量和结构变化是否符合预期。
