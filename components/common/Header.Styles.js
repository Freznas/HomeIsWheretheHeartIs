
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  backIcon: {
    fontSize: 20,
    color: 'white',
  },
  rightButtons: {
    position: 'absolute',
    right: 16,
    top: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  themeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeIcon: {
    fontSize: 16,
  },
  supportButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportIcon: {
    fontSize: 16,
  },
  profileButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 16,
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: 4,
    marginTop: 36,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scroll: {
    padding: 16,
  },
});
