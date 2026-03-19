# Variance & Standard Deviation Practice

## Formulas

**Variance** measures how spread out the data is from the mean. **Standard deviation** is the square root of the variance — it tells you, on average, how far each data point is from the mean, in the same units as the original data.

$$s^2 = \frac{\sum_{i=1}^{n}(x_i - \bar{x})^2}{n - 1}$$

$$s = \sqrt{s^2} = \sqrt{\frac{\sum_{i=1}^{n}(x_i - \bar{x})^2}{n - 1}}$$

| Symbol | Meaning |
|:------:|:--------|
| $x_i$ | Each data value |
| $\bar{x}$ | Mean of the data set |
| $n$ | Number of data values |
| $s^2$ | **Variance** — the result *before* taking the square root |
| $s$ | **Standard deviation** — the result *after* taking the square root |

---

## Your Data

A student tested how the angle of a ramp affects the distance a marble rolls after leaving the ramp. Three trials were conducted at each ramp angle. Here are the results:

| Ramp Angle | Trial 1 (cm) | Trial 2 (cm) | Trial 3 (cm) |
|:----------:|:------------:|:------------:|:------------:|
| 15° | 38.0 | 44.0 | 41.0 |
| 30° | 75.0 | 84.0 | 78.0 |
| 45° | 102.0 | 114.0 | 108.0 |

Calculate the **mean**, **variance**, and **standard deviation** for each IV level below. Report all answers to **one decimal place** (matching the precision of the original measurements).

---

## IV Level 1 — Ramp Angle: 15°

**Data:** 38.0 cm, 44.0 cm, 41.0 cm

**Step 1:** Calculate the **mean** of the three data values.

**Step 2:** Fill in the deviations table. For each data value, subtract the mean to find the deviation, then square it. The data values are pre-filled for you.

**Step 3:** Calculate the **variance** — add up all the squared deviations and divide by $n - 1$ (where $n = 3$, so divide by 2).

> **Why do we divide by $n - 1$ instead of $n$?** You may have previously learned to divide by $n$ when calculating standard deviation. When working with a *sample* (which is almost always the case in experiments — you can't run infinite trials), dividing by $n$ tends to *underestimate* the true spread of the data. Dividing by $n - 1$ corrects for this bias and gives a more accurate estimate. This adjustment is called **Bessel's correction**, and it is the standard method used in Science Olympiad.

**Step 4:** Calculate the **standard deviation** — take the square root of the variance.

Don't forget to include the correct **units** for both variance and standard deviation. *(Hint: think about what happens to units when you square them.)*

---

## IV Level 2 — Ramp Angle: 30°

**Data:** 75.0 cm, 84.0 cm, 78.0 cm

Follow the same steps: mean → deviations table → variance → standard deviation.

---

## IV Level 3 — Ramp Angle: 45°

**Data:** 102.0 cm, 114.0 cm, 108.0 cm

Same process — mean, deviations, variance, and standard deviation.
