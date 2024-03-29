import React, { useContext, useState, useEffect } from 'react';
import { View, SafeAreaView, StyleSheet, TouchableOpacity, ScrollView, TextInput, Touchable } from 'react-native';
import { BaseText } from '../constants/TextStyles';
import { AuthContext } from '../navigation/AuthProvider';
import { AppContext } from '../navigation/AppProvider';
import { db } from '../../firebase';
import { Entypo } from '@expo/vector-icons';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import { useIsFocused } from '@react-navigation/native';
import Modal from 'react-native-modal';
import colors from '../constants/colors';
import SummaryBox from '../components/SummaryBox';
import DismissKeyboard from '../components/DismissKeyboard';

const ProfileScreen = () => {
  const isFocused = useIsFocused();
  const { user, logout } = useContext(AuthContext);
  const userRef = db.collection('users').doc(user.uid);
  const { addSwitch, profileChange, toggleProfileChange } = useContext(AppContext);
  const [initials, setInitials] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [signoutModalVisible, setSignoutModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [logsInfo, setLogsInfo] = useState([]);
  const [editedFirstName, setEditedFirstName] = useState('');
  const [editedLastName, setEditedLastName] = useState('');

  useEffect(() => {}, [isFocused]);

  useEffect(() => {
    userRef.get().then(doc => {
      setFirstName(doc.data().name.first.toString());
      setLastName(doc.data().name.last.toString());
      setInitials(`${doc.data().name.first.toString()[0]}${doc.data().name.last.toString()[0]}`);
    });
  }, [profileChange]);
  
  useEffect(() => {
    let tmpLogsArr = [];
    const fetchInfo = async () => {
      // get the data from each log
      await userRef.collection('logs').get().then(snapshot => {
        snapshot.docs.map(doc => {
          tmpLogsArr.push({
            id: doc.data().id,
            name: doc.data().name,
            unit: doc.data().unit,
            color: doc.data().color,
          });
        });
      });
      setLogsInfo(tmpLogsArr);
    }
    fetchInfo();
  }, [addSwitch]);

  const handleOnEditSave = async () => {
    if (!editedFirstName.trim() && !editedLastName.trim()) {
      setEditModalVisible(false);
      setEditedFirstName('');
      setEditedLastName('');
      return;
    }
    const first = editedFirstName.trim() ? editedFirstName.trim() : firstName;
    const last = editedLastName.trim() ? editedLastName.trim() : lastName;
    await userRef.update({
      name: {
        first: first,
        last: last,
      }
    });
    toggleProfileChange();
    setEditModalVisible(false);
    setEditedFirstName('');
    setEditedLastName('');
  }

  const logsInfoArr = logsInfo.map(log => (
    <View
      style={styles.summaryBoxContainer}
      key={log.name}
    >
      <SummaryBox
        logId={log.id}
        name={log.name}
        unit={log.unit}
        color={log.color}
      />
    </View>
  ));

  return (
    <SafeAreaView style={styles.container}>
        <Modal
          isVisible={editModalVisible}
          animationInTiming={400}
          animationOutTiming={400}
          onBackdropPress={() => {
            setEditModalVisible(false);
            setEditedFirstName('');
            setEditedLastName('');
          }}
          >
          <DismissKeyboard>
            <View style={styles.editModal}>
              <TextInput
                style={styles.inputBox}
                value={editedFirstName}
                onChangeText={input => setEditedFirstName(input)}
                placeholder={firstName}
                placeholderTextColor='rgba(0, 0, 0, 0.3)'
              />
              <TextInput
                style={styles.inputBox}
                value={editedLastName}
                onChangeText={input => setEditedLastName(input)}
                placeholder={lastName}
                placeholderTextColor='rgba(0, 0, 0, 0.3)'
              />
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => {
                  handleOnEditSave();
                }}
              >
                <BaseText style={{ fontSize: 16, color: colors.authButtonColor }}>Save</BaseText>
              </TouchableOpacity>
            </View>
          </DismissKeyboard>
        </Modal>
        <Modal
          isVisible={signoutModalVisible}
          animationInTiming={400}
          animationOutTiming={400}
          onBackdropPress={() => setSignoutModalVisible(false)}
        >
          <View style={styles.signoutModal}>
            <BaseText style={{ color: colors.authBGColor, fontSize: 15 }}>Are you sure you want to sign out?</BaseText>
            <TouchableOpacity
              style={styles.button}
              onPress={() => logout()}
            >
              <BaseText style={styles.signoutText}>Sign out</BaseText>
            </TouchableOpacity>
          </View>
        </Modal>
        <View style={styles.titleBar}>
          <Menu 
            opened={menuVisible}
            onSelect={value => {
              if (value == 1) {
                setMenuVisible(false);
                setEditModalVisible(true);
              } else {
                setMenuVisible(false);
                setSignoutModalVisible(true);
              }
            }}
            onBackdropPress={() => setMenuVisible(false)}
          >
            <MenuOptions optionsContainerStyle={styles.menuOptions}>
              <MenuOption value={1} style={{ alignSelf: 'center' }}>
                <BaseText style={{ color: colors.authBGColor, fontSize: 15 }}>Edit Profile</BaseText>
              </MenuOption>
              <MenuOption value={2} style={{ alignSelf: 'center' }}>
                <BaseText style={{ color: 'red', fontSize: 15 }}>Sign out</BaseText>
              </MenuOption>
            </MenuOptions>
            <View style={{ marginBottom: 10 }}>
              <TouchableOpacity onPress={() => setMenuVisible(true)}>
                <Entypo name="dots-three-vertical" size={24} color={colors.authButtonColor} />
              </TouchableOpacity>
            </View>
            <MenuTrigger />
          </Menu>
        </View>
        <ScrollView alwaysBounceVertical={false} >
          <View style={[styles.profileContainer, { borderBottomColor: colors.authBGColor }]}>
              <View style={styles.profileImage}>
                <BaseText style={{ color: colors.authBGColor, fontSize: 50 }}>{initials}</BaseText>
              </View>
            <BaseText
              style={{ color: colors.authButtonColor, fontSize: 22, marginTop: 16, marginBottom: 20 }}
            >
              {`${firstName} ${lastName}`}
            </BaseText>
          </View>
          <View style={styles.detailsContainer}>
            <BaseText style={{ color: colors.authButtonColor, fontSize: 16 }}>Summary:</BaseText>
          </View>
          <View style={styles.summaryContainer}>
            {logsInfoArr}
          </View>
        </ScrollView>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  editModal: {
    height: '30%',
    width: '80%',
    backgroundColor: colors.authButtonColor,
    alignSelf: 'center',
    borderRadius: 20,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputBox: {
    width: '65%',
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Futura',
    margin: 10,
    padding: 5,
    borderColor: colors.authBGColor,
    borderBottomWidth: 1,
    color: colors.authBGColor,
  },
  saveButton: {
    marginTop: 20,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: colors.authBGColor,
    borderColor: colors.authButtonColor,
    borderWidth: 1,
    borderRadius: 20,
    width: 120,
  },
  signoutModal: {
    height: '17%',
    width: '80%',
    backgroundColor: colors.authButtonColor,
    alignSelf: 'center',
    borderRadius: 20,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
    marginHorizontal: 16,
  },
  right: {
    flexDirection: 'column',
  },
  profileContainer: {
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
  },
  profileImage: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 150,
    height: 150,
    borderRadius: 100,
    borderColor: colors.authButtonColor,
    borderWidth: 1.5,
  },
  detailsContainer: {
    marginTop: 16,
    marginBottom: 7,
    paddingHorizontal: 20,
  },
  button: {
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: colors.authBGColor,
    borderRadius: 20,
    width: 130,
    marginTop: 25,
  },
  signoutText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.authButtonColor,
  },
  menuOptions: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 130,
    paddingVertical: 5,
    backgroundColor: colors.authButtonColor,
    borderRadius: 10,
  },
  summaryContainer: {
    flex: 1,
    alignItems: 'center',
  },
  summaryBoxContainer: {
    width: '100%',
    height: 280,
  },
});

export default ProfileScreen;