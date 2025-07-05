import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;

const AnimatedText = Animated.createAnimatedComponent(Text);

const SplashScreen = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Fade in and scale up animation (0.0s - 1.0s)
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 1000,
        useNativeDriver: true,
      })
    ]).start();

    // Pulsing glow effect (1.0s - 2.0s)
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.5,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const glowTimer = setTimeout(() => {
      glowAnimation.start();
    }, 1000);

    // Final animation sequence (2.0s - 3.0s)
    const finalAnimation = setTimeout(() => {
      glowAnimation.stop();
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start(() => {
        navigation.replace('Home');
      });
    }, 2500);

    return () => {
      clearTimeout(glowTimer);
      clearTimeout(finalAnimation);
      glowAnimation.stop();
    };
  }, [navigation, fadeAnim, scaleAnim, glowAnim]);

  // Interpolate glow opacity for the pulsing effect
  const glowEffect = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8]
  });

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#000000" barStyle="light-content" />
      <Animated.View 
        style={[
          styles.animationContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
        <View style={styles.textContainer}>
          <Animated.View 
            style={[
              styles.glowEffect,
              {
                opacity: glowEffect,
                transform: [{ scale: glowAnim.interpolate({
                  inputRange: [0.5, 1],
                  outputRange: [1, 1.2]
                }) }]
              }
            ]}
          />
          <Animated.Text style={styles.appName}>
            Streamify
          </Animated.Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  animationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowEffect: {
    position: 'absolute',
    width: '120%',
    height: '150%',
    backgroundColor: 'rgba(0, 191, 255, 0.5)',
    borderRadius: 30,
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#00BFFF',
    textAlign: 'center',
    zIndex: 1,
  },
});

export default SplashScreen;
