// export function initCursorEffect() {
//   const cursor = document.createElement('div');
//   cursor.className = 'cursor-trail';
//   document.body.appendChild(cursor);

//   let mouseX = 0;
//   let mouseY = 0;
//   let cursorX = 0;
//   let cursorY = 0;
//   let isMoving = false;
//   let lastMoveTime = 0;

//   document.addEventListener('mousemove', (e) => {
//     mouseX = e.clientX;
//     mouseY = e.clientY;
//     isMoving = true;
//     lastMoveTime = Date.now();
//   });

//   function animate() {
//     const now = Date.now();
//     const timeSinceLastMove = now - lastMoveTime;

//     // Плавное следование за курсором
//     const dx = mouseX - cursorX;
//     const dy = mouseY - cursorY;

//     // Увеличиваем скорость следования
//     cursorX += dx * 0.2;
//     cursorY += dy * 0.2;

//     // Добавляем эффект затухания при остановке
//     if (timeSinceLastMove > 100) {
//       isMoving = false;
//       cursor.style.opacity = '0.5';
//     } else {
//       cursor.style.opacity = '1';
//     }

//     cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
//     requestAnimationFrame(animate);
//   }

//   animate();
// }
