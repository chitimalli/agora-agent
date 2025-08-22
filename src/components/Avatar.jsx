/*
Enhanced 3D Avatar Component for Agora Agent
Features advanced facial expressions, lip-sync, and multi-avatar support
*/

import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { button, useControls } from "leva";
import React, { useEffect, useRef, useState } from "react";

import * as THREE from "three";
import { useChat } from "../hooks/useChat";
import { useAgora } from "../hooks/useAgora";

const facialExpressions = {
  default: {},
  smile: {
    browInnerUp: 0.15,
    eyeSquintLeft: 0.3,
    eyeSquintRight: 0.3,
    mouthSmileLeft: 0.8,
    mouthSmileRight: 0.8,
    cheekSquintLeft: 0.4,
    cheekSquintRight: 0.4,
  },
  funnyFace: {
    jawLeft: 0.63,
    mouthPucker: 0.53,
    noseSneerLeft: 1,
    noseSneerRight: 0.39,
    mouthLeft: 1,
    eyeLookUpLeft: 1,
    eyeLookUpRight: 1,
    cheekPuff: 0.9999924982764238,
    mouthDimpleLeft: 0.414743888682652,
    mouthRollLower: 0.32,
    mouthSmileLeft: 0.35499733688813034,
    mouthSmileRight: 0.35499733688813034,
  },
  sad: {
    mouthFrownLeft: 1,
    mouthFrownRight: 1,
    mouthShrugLower: 0.78341,
    browInnerUp: 0.452,
    eyeSquintLeft: 0.72,
    eyeSquintRight: 0.75,
    eyeLookDownLeft: 0.5,
    eyeLookDownRight: 0.5,
    jawForward: 1,
  },
  surprised: {
    eyeWideLeft: 0.5,
    eyeWideRight: 0.5,
    jawOpen: 0.351,
    mouthFunnel: 1,
    browInnerUp: 1,
  },
  angry: {
    browDownLeft: 1,
    browDownRight: 1,
    eyeSquintLeft: 1,
    eyeSquintRight: 1,
    jawForward: 1,
    jawLeft: 1,
    mouthShrugLower: 1,
    noseSneerLeft: 1,
    noseSneerRight: 0.42,
    eyeLookDownLeft: 0.16,
    eyeLookDownRight: 0.16,
    cheekSquintLeft: 1,
    cheekSquintRight: 1,
    mouthClose: 0.23,
    mouthFunnel: 0.63,
    mouthDimpleRight: 1,
  },
  crazy: {
    browInnerUp: 0.9,
    jawForward: 1,
    noseSneerLeft: 0.5700000000000001,
    noseSneerRight: 0.51,
    eyeLookDownLeft: 0.39435766259644545,
    eyeLookUpRight: 0.4039761421719682,
    eyeLookInLeft: 0.9618479575523053,
    eyeLookInRight: 0.9618479575523053,
    jawOpen: 0.9618479575523053,
    mouthDimpleLeft: 0.9618479575523053,
    mouthDimpleRight: 0.9618479575523053,
    mouthStretchLeft: 0.27893590769016857,
    mouthStretchRight: 0.2885543872656917,
    mouthSmileLeft: 0.5578718153803371,
    mouthSmileRight: 0.38473918302092225,
    tongueOut: 0.9618479575523053,
  },
};

const corresponding = {
  A: "viseme_PP",
  B: "viseme_kk",
  C: "viseme_I",
  D: "viseme_AA",
  E: "viseme_O",
  F: "viseme_U",
  G: "viseme_FF",
  H: "viseme_TH",
  X: "viseme_PP",
};

// Enhanced mouth morph targets for more realistic speech
const mouthMorphTargets = {
  // Vowel sounds - wider mouth shapes
  A: { jawOpen: 0.7, mouthOpen: 0.8, mouthWide: 0.5 },
  E: { jawOpen: 0.4, mouthOpen: 0.6, mouthWide: 0.7, mouthSmileLeft: 0.3, mouthSmileRight: 0.3 },
  I: { jawOpen: 0.2, mouthOpen: 0.3, mouthWide: 0.8, mouthSmileLeft: 0.5, mouthSmileRight: 0.5 },
  O: { jawOpen: 0.5, mouthOpen: 0.7, mouthFunnel: 0.6, mouthPucker: 0.4 },
  U: { jawOpen: 0.3, mouthOpen: 0.4, mouthFunnel: 0.8, mouthPucker: 0.7 },
  
  // Consonant sounds
  B: { mouthPressLeft: 0.8, mouthPressRight: 0.8, mouthClose: 0.9 },
  C: { jawOpen: 0.2, mouthOpen: 0.3 },
  D: { jawOpen: 0.3, mouthOpen: 0.4, tongueOut: 0.2 },
  F: { jawOpen: 0.1, mouthOpen: 0.2, mouthFunnel: 0.3 },
  G: { jawOpen: 0.4, mouthOpen: 0.5 },
  H: { jawOpen: 0.3, mouthOpen: 0.4 },
  
  // Default/silence
  X: { jawOpen: 0.05, mouthOpen: 0.1 }
};

let setupMode = false;

export function Avatar({ currentExpression, currentAnimation, currentAvatar = "Aurora", ...props }) {
  // Define available avatars
  const availableAvatars = {
    Aurora: "Aurora.glb",
    Celeste: "Celeste.glb", 
    Lyra: "Lyra.glb"
  };

  // Load the selected avatar model
  const avatarModel = availableAvatars[currentAvatar] || availableAvatars.Aurora;
  const { nodes, materials, scene } = useGLTF(
    `${import.meta.env.BASE_URL}models/Avatars/${avatarModel}`
  );

  const { message, onMessagePlayed, chat } = useChat();
  const { lipSyncData, audioLevel } = useAgora(); // Get WebAudio lip sync data

  const [lipsync, setLipsync] = useState();
  
  // Smoothing states for lip sync
  const smoothedAudioLevel = useRef(0);
  const lastViseme = useRef('X');
  const visemeTransition = useRef(0);
  const mouthTargetValues = useRef({});

  useEffect(() => {
    console.log(message);
    if (!message) {
      // If no manual animation override, use Idle
      if (!currentAnimation) {
        setAnimation("Idle");
      }
      return;
    }
    // During message playback, use message animation if no manual override
    if (!currentAnimation) {
      setAnimation(message.animation);
    }
    // Use message facial expression if no manual override
    if (!currentExpression) {
      setFacialExpression(message.facialExpression);
    }
    setLipsync(message.lipsync);
    const audio = new Audio("data:audio/mp3;base64," + message.audio);
    audio.play();
    setAudio(audio);
    audio.onended = onMessagePlayed;
  }, [message, currentAnimation, currentExpression]);

  const { animations } = useGLTF(`${import.meta.env.BASE_URL}models/animations.glb`);

  // Debug: Log available animations to help fix UI
  useEffect(() => {
    console.log('Available animations:', animations.map(a => a.name));
    console.log('Current avatar:', currentAvatar);
    console.log('Avatar model path:', `${import.meta.env.BASE_URL}models/Avatars/${avatarModel}`);
  }, [animations, currentAvatar, avatarModel]);

  const group = useRef();
  const animationMixer = useRef();
  const animationActions = useRef({});
  
  // Custom animation system that works with any avatar
  useEffect(() => {
    if (group.current && animations.length > 0 && scene) {
      console.log(`🎭 Setting up animations for avatar: ${currentAvatar}`);
      console.log('Group children count:', group.current.children.length);
      
      // Clear previous mixer
      if (animationMixer.current) {
        console.log('Clearing previous animation mixer');
        animationMixer.current.stopAllAction();
        animationMixer.current.setTime(0);
        animationMixer.current = null;
      }

      // Wait for the scene to be fully loaded
      setTimeout(() => {
        if (!group.current) return;
        
        // Find the skeleton root (usually named "Hips")
        let skeletonRoot = null;
        scene.traverse((child) => {
          if (child.type === 'Bone' && child.name === 'Hips') {
            skeletonRoot = child;
            console.log(`Found skeleton root: ${child.name}`);
          }
        });

        // Use the skeleton root or fallback to group.current
        const animationTarget = skeletonRoot || group.current;
        console.log(`🎯 Animation target: ${animationTarget.name || animationTarget.type}`);
        
        // Create new animation mixer
        animationMixer.current = new THREE.AnimationMixer(animationTarget);
        animationActions.current = {};
        
        // Create actions for all animations
        let successCount = 0;
        animations.forEach((clip) => {
          try {
            const action = animationMixer.current.clipAction(clip);
            action.setLoop(THREE.LoopRepeat);
            animationActions.current[clip.name] = action;
            successCount++;
            console.log(`✅ Created action for: ${clip.name}`);
          } catch (error) {
            console.warn(`❌ Failed to create action for ${clip.name}:`, error.message);
          }
        });
        
        console.log(`🎬 Animation setup complete: ${successCount}/${animations.length} actions created for ${currentAvatar}`);
        console.log('Available actions:', Object.keys(animationActions.current));
        
        // Start default animation after setup
        if (animationActions.current['Idle']) {
          console.log('🚀 Starting default Idle animation');
          animationActions.current['Idle'].play();
        }
      }, 100); // Small delay to ensure scene is ready
    }
    
    return () => {
      if (animationMixer.current) {
        console.log(`🧹 Cleaning up animations for ${currentAvatar}`);
        animationMixer.current.stopAllAction();
        animationMixer.current = null;
      }
    };
  }, [currentAvatar, animations, scene]);
  
  // Update animation mixer on each frame and handle facial expressions
  useFrame((state, deltaTime) => {
    // Update custom animation mixer
    if (animationMixer.current) {
      animationMixer.current.update(deltaTime);
    }
    
    // Handle facial expressions
    const morphMesh = getMorphTargetMesh();
    if (!setupMode && morphMesh && morphMesh.morphTargetDictionary) {
      Object.keys(morphMesh.morphTargetDictionary).forEach((key) => {
        const mapping = facialExpressions[facialExpression];
        if (key === "eyeBlinkLeft" || key === "eyeBlinkRight") {
          return; // eyes wink/blink are handled separately
        }
        if (mapping && mapping[key]) {
          lerpMorphTarget(key, mapping[key], 0.1);
        } else {
          lerpMorphTarget(key, 0, 0.1);
        }
      });
    }

    lerpMorphTarget("eyeBlinkLeft", blink || winkLeft ? 1 : 0, 0.5);
    lerpMorphTarget("eyeBlinkRight", blink || winkRight ? 1 : 0, 0.5);

    // LIPSYNC - WebAudio based with smooth interpolation
    if (setupMode) {
      return;
    }

    // Smooth the audio level to reduce jittering but keep it responsive
    const targetAudioLevel = audioLevel || 0;
    smoothedAudioLevel.current = THREE.MathUtils.lerp(
      smoothedAudioLevel.current,
      targetAudioLevel,
      1 - Math.exp(-15 * deltaTime) // Faster response for more visible changes
    );

    const appliedMorphTargets = [];
    
    // Use WebAudio lip sync data if available
    if (lipSyncData && lipSyncData.viseme && smoothedAudioLevel.current > 0.01) {
      const currentViseme = lipSyncData.viseme;
      const visemeTarget = corresponding[currentViseme];
      const mouthShape = mouthMorphTargets[currentViseme];
      
      // Handle viseme transitions more quickly
      if (lastViseme.current !== currentViseme) {
        visemeTransition.current = 0;
        lastViseme.current = currentViseme;
      }
      visemeTransition.current = Math.min(visemeTransition.current + deltaTime * 12, 1); // Doubled transition speed
      
      if (visemeTarget) {
        appliedMorphTargets.push(visemeTarget);
        const intensity = Math.min(smoothedAudioLevel.current * 2.0, 1.0) * visemeTransition.current; // Doubled intensity
        lerpMorphTarget(visemeTarget, intensity, 0.8);
      }
      
      // Apply enhanced mouth shapes with smooth interpolation and higher intensity
      if (mouthShape) {
        Object.entries(mouthShape).forEach(([morphTarget, value]) => {
          const smoothedIntensity = value * smoothedAudioLevel.current * 4 * visemeTransition.current; // Quadrupled intensity
          const clampedIntensity = Math.min(smoothedIntensity, value * 1.2); // Allow slightly over the base value
          smoothLerpMouthTarget(morphTarget, clampedIntensity, deltaTime);
          appliedMorphTargets.push(morphTarget);
        });
      }
      
      // More pronounced jaw movement
      const breathingVariation = Math.sin(state.clock.elapsedTime * 2) * 0.1;
      const baseJawOpen = (mouthShape?.jawOpen || 0.3) + breathingVariation;
      const jawIntensity = baseJawOpen * smoothedAudioLevel.current * 3.0 * visemeTransition.current; // Tripled intensity
      smoothLerpMouthTarget("jawOpen", Math.min(jawIntensity, 1.0), deltaTime);
      
      // More visible mouth width variation
      const mouthWidth = smoothedAudioLevel.current * 0.8 * visemeTransition.current; // Doubled width
      smoothLerpMouthTarget("mouthLeft", mouthWidth, deltaTime);
      smoothLerpMouthTarget("mouthRight", mouthWidth, deltaTime);
      
      appliedMorphTargets.push("jawOpen", "mouthLeft", "mouthRight");
    }
    // Fallback to original message-based lip sync with smoothing
    else if (message && lipsync) {
      const currentAudioTime = audio.currentTime;
      for (let i = 0; i < lipsync.mouthCues.length; i++) {
        const mouthCue = lipsync.mouthCues[i];
        if (
          currentAudioTime >= mouthCue.start &&
          currentAudioTime <= mouthCue.end
        ) {
          const visemeValue = mouthCue.value;
          const visemeTarget = corresponding[visemeValue];
          const mouthShape = mouthMorphTargets[visemeValue];
          
          if (visemeTarget) {
            appliedMorphTargets.push(visemeTarget);
            lerpMorphTarget(visemeTarget, 1, 0.4);
          }
          
          // Apply enhanced mouth shapes with smooth transitions
          if (mouthShape) {
            Object.entries(mouthShape).forEach(([morphTarget, value]) => {
              smoothLerpMouthTarget(morphTarget, value, deltaTime);
              appliedMorphTargets.push(morphTarget);
            });
          }
          break;
        }
      }
    }

    // Reset unused morph targets with smooth transitions
    Object.values(corresponding).forEach((value) => {
      if (appliedMorphTargets.includes(value)) {
        return;
      }
      lerpMorphTarget(value, 0, 0.2);
    });
    
    // Smoothly reset mouth morph targets when no audio
    const allMouthTargets = [
      "jawOpen", "mouthOpen", "mouthWide", "mouthSmileLeft", "mouthSmileRight",
      "mouthFunnel", "mouthPucker", "mouthPressLeft", "mouthPressRight", 
      "mouthClose", "tongueOut", "mouthLeft", "mouthRight"
    ];
    
    allMouthTargets.forEach((target) => {
      if (!appliedMorphTargets.includes(target)) {
        smoothLerpMouthTarget(target, 0, deltaTime);
      }
    });
    
    // Smooth reset when no audio activity
    if (!lipSyncData || smoothedAudioLevel.current <= 0.01) {
      // Gentle reset to slightly open mouth for natural look
      smoothLerpMouthTarget("jawOpen", 0.02, deltaTime);
      smoothLerpMouthTarget("mouthOpen", 0.01, deltaTime);
    }
  });
  
  // Legacy actions and mixer for compatibility (keeping for now)
  const { actions, mixer } = useAnimations(animations, group);
  const [animation, setAnimation] = useState(
    animations.find((a) => a.name === "Idle") ? "Idle" : animations[0].name // Check if Idle animation exists otherwise use first animation
  );
  
  // Update animation when currentAnimation prop changes
  useEffect(() => {
    if (currentAnimation) {
      // Check if the animation exists before trying to set it
      const animationExists = animations.find(a => a.name === currentAnimation);
      if (animationExists) {
        setAnimation(currentAnimation);
        
        // Auto-map animation to facial expression if no manual expression override
        if (!currentExpression) {
          const animationToExpressionMap = {
            "Idle": "",
            "Laughing": "funnyFace",
            "Crying": "sad", 
            "Angry": "angry",
            "Terrified": "surprised",
            "Talking_0": "",
            "Talking_1": "smile",
            "Talking_2": "surprised"
          };
          
          const mappedExpression = animationToExpressionMap[currentAnimation];
          if (mappedExpression !== undefined) {
            setFacialExpression(mappedExpression);
          }
        }
      } else {
        console.warn(`Animation "${currentAnimation}" not found. Available animations:`, animations.map(a => a.name));
        // Fallback to Idle if animation doesn't exist
        setAnimation("Idle");
      }
    } else if (!message) {
      setAnimation("Idle");
    }
  }, [currentAnimation, message, animations, currentExpression]);
  
  useEffect(() => {
    // Play animation using custom system
    console.log(`Attempting to play animation: ${animation} for avatar: ${currentAvatar}`);
    console.log('Custom actions available:', Object.keys(animationActions.current));
    
    if (animationActions.current[animation]) {
      console.log(`✓ Playing animation: ${animation} using custom system`);
      
      // Stop all other animations with fade out
      Object.entries(animationActions.current).forEach(([name, action]) => {
        if (name !== animation && action.isRunning()) {
          action.fadeOut(0.3);
        }
      });
      
      // Play the requested animation with fade in
      const action = animationActions.current[animation];
      action.reset();
      action.fadeIn(0.3);
      action.play();
      
      return () => {
        if (action && action.isRunning()) {
          action.fadeOut(0.3);
        }
      };
    } else {
      console.warn(`✗ Animation "${animation}" not found in custom actions for ${currentAvatar}:`, Object.keys(animationActions.current));
      
      // Fallback to legacy system
      if (actions[animation]) {
        console.log(`Fallback: Using legacy action for ${animation}`);
        actions[animation]
          .reset()
          .fadeIn(mixer && mixer.stats.actions.inUse === 0 ? 0 : 0.5)
          .play();
        return () => {
          if (actions[animation]) {
            actions[animation].fadeOut(0.5);
          }
        };
      } else {
        console.warn(`Animation "${animation}" not found in either system`);
      }
    }
  }, [animation, actions, mixer, currentAvatar]);

  const lerpMorphTarget = (target, value, speed = 0.1) => {
    scene.traverse((child) => {
      if (child.isSkinnedMesh && child.morphTargetDictionary) {
        const index = child.morphTargetDictionary[target];
        if (
          index === undefined ||
          child.morphTargetInfluences[index] === undefined
        ) {
          return;
        }
        child.morphTargetInfluences[index] = THREE.MathUtils.lerp(
          child.morphTargetInfluences[index],
          value,
          speed
        );
        if (!setupMode) {
          try {
            set({
              [target]: value,
            });
          } catch (e) {}
        }
      }
    });
  };

  // Enhanced smooth interpolation for mouth targets with easing
  const smoothLerpMouthTarget = (target, targetValue, deltaTime) => {
    if (!mouthTargetValues.current[target]) {
      mouthTargetValues.current[target] = 0;
    }
    
    // Faster interpolation with more visible movements
    const isOpening = targetValue > mouthTargetValues.current[target];
    const smoothSpeed = isOpening ? 15.0 : 18.0; // Much faster for more visible changes
    
    mouthTargetValues.current[target] = THREE.MathUtils.lerp(
      mouthTargetValues.current[target],
      targetValue,
      1 - Math.exp(-smoothSpeed * deltaTime)
    );
    
    lerpMorphTarget(target, mouthTargetValues.current[target], 0.9); // Higher lerp factor
  };

  const [blink, setBlink] = useState(false);
  const [winkLeft, setWinkLeft] = useState(false);
  const [winkRight, setWinkRight] = useState(false);
  const [facialExpression, setFacialExpression] = useState("");
  const [audio, setAudio] = useState();

  // Update facial expression when currentExpression prop changes
  useEffect(() => {
    if (currentExpression) {
      setFacialExpression(currentExpression);
    } else if (!message) {
      setFacialExpression(""); // Reset to default when no override and no message
    }
  }, [currentExpression, message]);

  // Helper function to get the first mesh with morph targets from current avatar
  const getMorphTargetMesh = () => {
    let morphTargetMesh = null;
    scene.traverse((child) => {
      if (!morphTargetMesh && child.isSkinnedMesh && child.morphTargetDictionary && Object.keys(child.morphTargetDictionary).length > 0) {
        morphTargetMesh = child;
      }
    });
    return morphTargetMesh;
  };

  useControls("FacialExpressions", {
    chat: button(() => chat()),
    winkLeft: button(() => {
      setWinkLeft(true);
      setTimeout(() => setWinkLeft(false), 300);
    }),
    winkRight: button(() => {
      setWinkRight(true);
      setTimeout(() => setWinkRight(false), 300);
    }),
    animation: {
      value: animation,
      options: animations.map((a) => a.name),
      onChange: (value) => setAnimation(value),
    },
    facialExpression: {
      options: Object.keys(facialExpressions),
      onChange: (value) => setFacialExpression(value),
    },
    enableSetupMode: button(() => {
      setupMode = true;
    }),
    disableSetupMode: button(() => {
      setupMode = false;
    }),
    logMorphTargetValues: button(() => {
      const morphMesh = getMorphTargetMesh();
      if (!morphMesh || !morphMesh.morphTargetDictionary) {
        console.log("No morph target mesh found for current avatar");
        return;
      }
      
      const emotionValues = {};
      Object.keys(morphMesh.morphTargetDictionary).forEach((key) => {
        if (key === "eyeBlinkLeft" || key === "eyeBlinkRight") {
          return; // eyes wink/blink are handled separately
        }
        const value =
          morphMesh.morphTargetInfluences[
            morphMesh.morphTargetDictionary[key]
          ];
        if (value > 0.01) {
          emotionValues[key] = value;
        }
      });
      console.log(JSON.stringify(emotionValues, null, 2));
    }),
  });

  const [, set] = useControls("MorphTarget", () => {
    const morphMesh = getMorphTargetMesh();
    if (!morphMesh || !morphMesh.morphTargetDictionary) {
      return {};
    }
    
    return Object.assign(
      {},
      ...Object.keys(morphMesh.morphTargetDictionary).map((key) => {
        return {
          [key]: {
            label: key,
            value: 0,
            min: morphMesh.morphTargetInfluences[
              morphMesh.morphTargetDictionary[key]
            ],
            max: 1,
            onChange: (val) => {
              if (setupMode) {
                lerpMorphTarget(key, val, 1);
              }
            },
          },
        };
      })
    );
  });

  useEffect(() => {
    let blinkTimeout;
    const nextBlink = () => {
      blinkTimeout = setTimeout(() => {
        setBlink(true);
        setTimeout(() => {
          setBlink(false);
          nextBlink();
        }, 200);
      }, THREE.MathUtils.randInt(1000, 5000));
    };
    nextBlink();
    return () => clearTimeout(blinkTimeout);
  }, []);

  return (
    <group {...props} dispose={null} ref={group}>
      <primitive object={nodes.Hips} />
      <skinnedMesh
        name="Wolf3D_Body"
        geometry={nodes.Wolf3D_Body.geometry}
        material={materials.Wolf3D_Body}
        skeleton={nodes.Wolf3D_Body.skeleton}
      />
      <skinnedMesh
        name="Wolf3D_Outfit_Bottom"
        geometry={nodes.Wolf3D_Outfit_Bottom.geometry}
        material={materials.Wolf3D_Outfit_Bottom}
        skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton}
      />
      <skinnedMesh
        name="Wolf3D_Outfit_Footwear"
        geometry={nodes.Wolf3D_Outfit_Footwear.geometry}
        material={materials.Wolf3D_Outfit_Footwear}
        skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton}
      />
      <skinnedMesh
        name="Wolf3D_Outfit_Top"
        geometry={nodes.Wolf3D_Outfit_Top.geometry}
        material={materials.Wolf3D_Outfit_Top}
        skeleton={nodes.Wolf3D_Outfit_Top.skeleton}
      />
      <skinnedMesh
        name="Wolf3D_Hair"
        geometry={nodes.Wolf3D_Hair.geometry}
        material={materials.Wolf3D_Hair}
        skeleton={nodes.Wolf3D_Hair.skeleton}
      />
      <skinnedMesh
        name="EyeLeft"
        geometry={nodes.EyeLeft.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeLeft.skeleton}
        morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences}
      />
      <skinnedMesh
        name="EyeRight"
        geometry={nodes.EyeRight.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeRight.skeleton}
        morphTargetDictionary={nodes.EyeRight.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeRight.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Head"
        geometry={nodes.Wolf3D_Head.geometry}
        material={materials.Wolf3D_Skin}
        skeleton={nodes.Wolf3D_Head.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Teeth"
        geometry={nodes.Wolf3D_Teeth.geometry}
        material={materials.Wolf3D_Teeth}
        skeleton={nodes.Wolf3D_Teeth.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences}
      />
    </group>
  );
}

// Preload all avatar models
useGLTF.preload(`${import.meta.env.BASE_URL}models/Avatars/Aurora.glb`);
useGLTF.preload(`${import.meta.env.BASE_URL}models/Avatars/Celeste.glb`);
useGLTF.preload(`${import.meta.env.BASE_URL}models/Avatars/Lyra.glb`);
useGLTF.preload(`${import.meta.env.BASE_URL}models/animations.glb`);
