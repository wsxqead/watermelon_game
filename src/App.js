import React, { useEffect, useRef, useState, useCallback } from "react";
import Matter from "matter-js";

const STELLAS = [
  { name: "하나코 나나", image: "/stella/stella1.png", size: 5 },
  { name: "유즈하 리코", image: "/stella/stella2.png", size: 7 },
  { name: "텐코 시부키", image: "/stella/stella3.png", size: 9 },
  { name: "아오쿠모 린", image: "/stella/stella4.png", size: 11 },
  { name: "이브", image: "/stella/stella5.png", size: 13 },
  { name: "아라하시 타비", image: "/stella/stella6.png", size: 15 },
  { name: "아카네 리제", image: "/stella/stella7.png", size: 17 },
  { name: "시라유키 히나", image: "/stella/stella8.png", size: 19 },
  { name: "네네코 마시로", image: "/stella/stella9.png", size: 21 },
  { name: "아야츠노 유니", image: "/stella/stella10.png", size: 23 },
  { name: "아이리 칸나", image: "/stella/stella11.png", size: 25 },
  { name: "강지", image: "/stella/stella12.png", size: 27 },
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
    Math.floor(Math.random() * STELLAS.length)
  );

  useEffect(() => {
    const images = STELLAS.map((stella) => {
      const img = new Image();
      img.src = stella.image;
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
        width: 600,
        height: 1000,
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
      const stella = STELLAS[nextStellaIndex];
      const scale = stella.size / 25; // 기본 이미지 크기(50px)에 맞춰 스케일 조정

      if (x - stella.size < 0) x = stella.size;
      if (x + stella.size > 600) x = 600 - stella.size;

      const newStella = Matter.Bodies.circle(x, 0, stella.size, {
        restitution: 0.5,
        friction: 0.005,
        frictionAir: 0.02,
        density: 0.001,
        render: {
          sprite: {
            texture: stella.image,
            xScale: scale,
            yScale: scale,
          },
        },
      });

      Matter.World.add(world, newStella);
      setStellas((prevStellas) => [...prevStellas, newStella]);

      setNextStellaIndex(Math.floor(Math.random() * STELLAS.length));
    },
    [world, imagesLoaded, gameOver, nextStellaIndex]
  );

  useEffect(() => {
    if (!imagesLoaded) return;

    Matter.Events.on(engine, "collisionStart", (event) => {
      const pairs = event.pairs;

      pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;

        if (
          bodyA.circleRadius === bodyB.circleRadius &&
          bodyA.render.sprite.texture === bodyB.render.sprite.texture
        ) {
          const currentIndex = STELLAS.findIndex(
            (stella) => stella.image === bodyA.render.sprite.texture
          );

          if (currentIndex < STELLAS.length - 1) {
            const newStellaData = STELLAS[currentIndex + 1];
            const newRadius = newStellaData.size;
            const scale = newRadius / 25;

            const upgradedStella = Matter.Bodies.circle(
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
                    texture: newStellaData.image,
                    xScale: scale,
                    yScale: scale,
                  },
                },
              }
            );

            Matter.World.remove(world, [bodyA, bodyB]);
            Matter.World.add(world, upgradedStella);

            setScore((score) => score + 10);
          }
        }
      });
    });

    Matter.Events.on(engine, "beforeUpdate", () => {
      stellas.forEach((stella) => {
        if (stella.position.y < 0) {
          setGameOver(true);
          Matter.Engine.clear(engine);
        }
      });
    });
  }, [engine, world, score, stellas, imagesLoaded]);

  return (
    <div id="container">
      <div id="image-preview">
        {STELLAS.map((stella, index) => (
          <div key={index} className="preview-item">
            <img src={stella.image} alt={stella.name} width={50} />
            <p>{stella.name}</p>
          </div>
        ))}
      </div>
      <div id="game-board-container">
        <div id="next-stella-preview">
          <img
            src={STELLAS[nextStellaIndex].image}
            alt="Next Stella"
            width={50}
          />
          <p>Next: {STELLAS[nextStellaIndex].name}</p>
        </div>
        <div id="game-board" ref={sceneRef} onClick={addStella} />
      </div>
      <div id="score">Score: {score}</div>
      {gameOver && <div className="game-over">Game Over!</div>}
    </div>
  );
}

export default App;
