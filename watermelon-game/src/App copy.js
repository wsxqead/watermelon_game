import React, { useEffect, useRef, useState, useCallback } from "react";
import Matter from "matter-js";

const stellaImages = [
  "/stella/stella1.png",
  "/stella/stella2.png",
  "/stella/stella3.png",
  "/stella/stella4.png",
  "/stella/stella5.png",
  "/stella/stella6.png",
  "/stella/stella7.png",
  "/stella/stella8.png",
  "/stella/stella9.png",
  "/stella/stella10.png",
  "/stella/stella11.png",
  "/stella/stella12.png",
];

const stellaNames = [
  "하나코 나나",
  "유즈하 리코",
  "텐코 시부키",
  "아오쿠모 린",
  "이브",
  "아라하시 타비",
  "아카네 리제",
  "시라유키 히나",
  "네네코 마시로",
  "아야츠노 유니",
  "아이리 칸나",
  "강지",
];

const stellaSizes = [
  5, // stella1 크기
  7, // stella2 크기
  9, // stella3 크기
  11, // stella4 크기
  13, // stella5 크기
  15, // stella6 크기
  17, // stella7 크기
  19, // stella8 크기
  21, // stella9 크기
  23, // stella10 크기
  25, // stella11 크기
  27, // stella12 크기
];

function App() {
  const sceneRef = useRef(null);
  const [engine] = useState(Matter.Engine.create());
  const [world] = useState(engine.world);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [stellas, setStellas] = useState([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [nextStellaIndex, setNextStellaIndex] = useState(
    Math.floor(Math.random() * 4)
  ); // 다음에 나올 스텔라 이미지 인덱스

  useEffect(() => {
    const images = stellaImages.map((src) => {
      const img = new Image();
      img.src = src;
      return img;
    });

    const allImagesLoaded = images.every((img) => img.complete);

    if (allImagesLoaded) {
      setImagesLoaded(true);
    } else {
      const handleLoad = () => {
        if (images.every((img) => img.complete)) {
          setImagesLoaded(true);
        }
      };

      images.forEach((img) => img.addEventListener("load", handleLoad));
      return () => {
        images.forEach((img) => img.removeEventListener("load", handleLoad));
      };
    }
  }, []);

  useEffect(() => {
    if (!imagesLoaded) return;

    const render = Matter.Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: 600, // 게임판 너비
        height: 1000, // 게임판 높이
        wireframes: false,
        background: "#ffffff",
      },
    });

    Matter.Render.run(render);

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    const ground = Matter.Bodies.rectangle(300, 1010, 600, 60, {
      isStatic: true,
    });
    const leftWall = Matter.Bodies.rectangle(-10, 500, 20, 1000, {
      isStatic: true,
    });
    const rightWall = Matter.Bodies.rectangle(610, 500, 20, 1000, {
      isStatic: true,
    });

    Matter.World.add(world, [ground, leftWall, rightWall]);

    return () => {
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
    };
  }, [engine, world, imagesLoaded]);

  const addStella = useCallback(
    (event) => {
      if (!imagesLoaded || gameOver) return;

      const rect = sceneRef.current.getBoundingClientRect();
      let x = event.clientX - rect.left; // 클릭한 위치의 x 좌표
      const radius = stellaSizes[nextStellaIndex];
      const scale = radius / 25; // 기본 이미지 크기(50px)에 맞춰 스케일 조정

      // x 좌표가 게임판의 경계를 넘지 않도록 조정
      if (x - radius < 0) x = radius;
      if (x + radius > 600) x = 600 - radius;

      const stella = Matter.Bodies.circle(x, 0, radius, {
        restitution: 0.5,
        friction: 0.005,
        frictionAir: 0.02,
        density: 0.001,
        render: {
          sprite: {
            texture: stellaImages[nextStellaIndex],
            xScale: scale,
            yScale: scale,
          },
        },
      });

      Matter.World.add(world, stella);
      setStellas((prevStellas) => [...prevStellas, stella]);

      // 다음에 나올 이미지 설정
      setNextStellaIndex(Math.floor(Math.random() * 4)); // 1-4 단계 중 하나로 설정
    },
    [world, imagesLoaded, gameOver, nextStellaIndex]
  );

  useEffect(() => {
    if (!imagesLoaded) return;

    Matter.Events.on(engine, "collisionStart", (event) => {
      const pairs = event.pairs;

      pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;

        // 동일한 크기와 이미지일 경우 합치기
        if (
          bodyA.circleRadius === bodyB.circleRadius &&
          bodyA.render.sprite.texture === bodyB.render.sprite.texture
        ) {
          const currentIndex = stellaImages.indexOf(
            bodyA.render.sprite.texture
          );

          if (currentIndex < stellaImages.length - 1) {
            const newSizeIndex = currentIndex + 1;
            const newRadius = stellaSizes[newSizeIndex];
            const scale = newRadius / 25; // 스케일 조정

            // 이미지를 업그레이드하기 전에 일시적으로 물리적 상호작용 중지
            Matter.Body.setStatic(bodyA, true);
            Matter.Body.setStatic(bodyB, true);

            // 새로운 스텔라 생성
            const newStella = Matter.Bodies.circle(
              (bodyA.position.x + bodyB.position.x) / 2,
              (bodyA.position.y + bodyB.position.y) / 2,
              newRadius,
              {
                restitution: 0.5,
                friction: 0.005,
                frictionAir: 0.02,
                density: 0.001,
                render: {
                  sprite: {
                    texture: stellaImages[newSizeIndex],
                    xScale: scale,
                    yScale: scale,
                  },
                },
              }
            );

            // 기존의 스텔라 제거 후 새 스텔라 추가
            Matter.World.remove(world, bodyA);
            Matter.World.remove(world, bodyB);
            Matter.World.add(world, newStella);

            setScore((score) => score + 10);
          }
        }
      });
    });

    Matter.Events.on(engine, "beforeUpdate", () => {
      stellas.forEach((stella) => {
        if (stella.position.y < 0) {
          // 스텔라가 화면 위쪽에 닿으면 게임 오버
          setGameOver(true);
          Matter.Engine.clear(engine);
        }
      });
    });
  }, [engine, world, score, stellas, imagesLoaded]);

  return (
    <div id="container">
      <div id="image-preview">
        {stellaImages.map((src, index) => (
          <div key={index} className="preview-item">
            <img src={src} alt={stellaNames[index]} width={50} />
            <p>{stellaNames[index]}</p>
          </div>
        ))}
      </div>
      <div id="game-board-container">
        <div id="next-stella-preview">
          <img
            src={stellaImages[nextStellaIndex]}
            alt="Next Stella"
            width={50}
          />
          <p>Next: {stellaNames[nextStellaIndex]}</p>
        </div>
        <div id="game-board" ref={sceneRef} onClick={addStella} />
      </div>
      <div id="score">Score: {score}</div>
      {gameOver && <div className="game-over">Game Over!</div>}
    </div>
  );
}

export default App;
